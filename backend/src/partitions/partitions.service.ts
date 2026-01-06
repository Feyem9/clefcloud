import { Injectable, Logger, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { S3Service } from '../aws/s3.service';
import { Partition } from './entities/partition.entity';
import { Favorite } from './entities/favorite.entity';
import { User } from '../users/entities/user.entity';
import { CreatePartitionDto } from './dto/create-partition.dto';
import { QueryPartitionDto } from './dto/query-partition.dto';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class PartitionsService {
  private readonly logger = new Logger(PartitionsService.name);

  constructor(
    @InjectRepository(Partition)
    private partitionRepository: Repository<Partition>,
    @InjectRepository(Favorite)
    private favoriteRepository: Repository<Favorite>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private s3Service: S3Service,
    private firebaseService: FirebaseService,
  ) {}

  /**
   * Créer une partition à partir du Cognito sub
   */
  async createFromCognitoSub(
    createPartitionDto: CreatePartitionDto,
    file: Express.Multer.File,
    cognitoSub: string,
  ) {
    // Récupérer l'utilisateur à partir du Cognito sub
    const user = await this.userRepository.findOne({ where: { cognito_sub: cognitoSub } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.create(createPartitionDto, file, user.id);
  }

  async create(
    createPartitionDto: CreatePartitionDto,
    file: Express.Multer.File,
    userId: number,
  ) {
    // Vérifier que l'utilisateur existe
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Nettoyer le nom du fichier
    const cleanTitle = createPartitionDto.title
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .toLowerCase();

    let storagePath: string;
    let downloadUrl: string;

    // Upload vers Firebase Storage si configuré, sinon fallback S3
    if (this.firebaseService && this.firebaseService.isEnabled) {
      const result = await this.firebaseService.uploadPartitionFile(user.id, file, cleanTitle);
      storagePath = result.storagePath;
      downloadUrl = result.downloadUrl;
    } else {
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `${Date.now()}_${cleanTitle}.${fileExtension}`;
      storagePath = `partitions/${userId}/${fileName}`;

      const { url } = await this.s3Service.uploadFile(file, storagePath, {
        title: createPartitionDto.title,
        category: createPartitionDto.category,
        uploadedBy: userId.toString(),
      });
      downloadUrl = url;
    }

    // Créer la partition dans la base de données (PostgreSQL) en utilisant le chemin/URL de stockage
    const partition = this.partitionRepository.create({
      ...createPartitionDto,
      storage_path: storagePath,
      download_url: downloadUrl,
      file_size: file.size,
      file_type: file.mimetype,
      created_by: userId,
      messe_part: createPartitionDto.category === 'messe' ? createPartitionDto.messePart : null,
    });

    const savedPartition = await this.partitionRepository.save(partition);

    this.logger.log(`Partition created: ${savedPartition.title} by user ${userId}`);

    return savedPartition;
  }

  async findAll(queryDto: QueryPartitionDto) {
    const { category, search, limit, offset } = queryDto;

    const queryBuilder = this.partitionRepository
      .createQueryBuilder('partition')
      .leftJoinAndSelect('partition.user', 'user');

    if (category) {
      queryBuilder.andWhere('partition.category = :category', { category });
    }

    if (search) {
      queryBuilder.andWhere(
        '(partition.title ILIKE :search OR partition.composer ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [partitions, total] = await queryBuilder
      .orderBy('partition.created_at', 'DESC')
      .take(limit)
      .skip(offset)
      .getManyAndCount();

    return {
      partitions,
      total,
      limit,
      offset,
    };
  }

  async findOne(id: number) {
    const partition = await this.partitionRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!partition) {
      throw new NotFoundException('Partition not found');
    }

    return partition;
  }

  async findByUser(userId: number, limit: number = 50, offset: number = 0) {
    const [partitions, total] = await this.partitionRepository.findAndCount({
      where: { created_by: userId },
      order: { created_at: 'DESC' },
      take: limit,
      skip: offset,
    });

    return {
      partitions,
      total,
      limit,
      offset,
    };
  }

  async getDownloadUrl(id: number, userId?: number) {
    const partition = await this.findOne(id);

    // Incrémenter le compteur de téléchargements
    partition.download_count += 1;
    await this.partitionRepository.save(partition);

    let url = partition.download_url;

    // Si aucune URL n'est stockée (anciennes données), fallback S3 signé
    if (!url && partition.storage_path) {
      url = await this.s3Service.getSignedUrl(partition.storage_path, 3600);
    }

    this.logger.log(`Partition ${id} downloaded by user ${userId || 'anonymous'}`);

    return {
      url,
      downloadUrl: url,
      expiresIn: 3600,
    };
  }

  async incrementViewCount(id: number) {
    const partition = await this.findOne(id);
    partition.view_count += 1;
    await this.partitionRepository.save(partition);
    return partition;
  }

  async remove(id: number, userId: number) {
    const partition = await this.findOne(id);

    // Vérifier que l'utilisateur est le propriétaire
    if (partition.created_by !== userId) {
      throw new ForbiddenException('You are not authorized to delete this partition');
    }

    // Supprimer du stockage Firebase (si activé) puis de S3 (compatibilité)
    if (this.firebaseService && this.firebaseService.isEnabled && partition.storage_path) {
      await this.firebaseService.deleteFile(partition.storage_path);
    }

    if (partition.storage_path) {
      await this.s3Service.deleteFile(partition.storage_path);
    }

    // Supprimer de la base de données
    await this.partitionRepository.remove(partition);

    this.logger.log(`Partition deleted: ${id} by user ${userId}`);

    return {
      message: 'Partition deleted successfully',
    };
  }

  // ========== FAVORIS ==========

  async addToFavorites(partitionId: number, userId: number) {
    const partition = await this.findOne(partitionId);

    // Vérifier si déjà en favoris
    const existing = await this.favoriteRepository.findOne({
      where: { partition_id: partitionId, user_id: userId },
    });

    if (existing) {
      throw new ConflictException('Partition already in favorites');
    }

    const favorite = this.favoriteRepository.create({
      partition_id: partitionId,
      user_id: userId,
    });

    await this.favoriteRepository.save(favorite);

    this.logger.log(`Partition ${partitionId} added to favorites by user ${userId}`);

    return {
      message: 'Partition added to favorites',
      favorite,
    };
  }

  async removeFromFavorites(partitionId: number, userId: number) {
    const favorite = await this.favoriteRepository.findOne({
      where: { partition_id: partitionId, user_id: userId },
    });

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    await this.favoriteRepository.remove(favorite);

    this.logger.log(`Partition ${partitionId} removed from favorites by user ${userId}`);

    return {
      message: 'Partition removed from favorites',
    };
  }

  async getFavorites(userId: number, limit: number = 50, offset: number = 0) {
    const [favorites, total] = await this.favoriteRepository.findAndCount({
      where: { user_id: userId },
      relations: ['partition', 'partition.user'],
      order: { created_at: 'DESC' },
      take: limit,
      skip: offset,
    });

    return {
      favorites: favorites.map((f) => f.partition),
      total,
      limit,
      offset,
    };
  }

  async isFavorite(partitionId: number, userId: number): Promise<boolean> {
    const favorite = await this.favoriteRepository.findOne({
      where: { partition_id: partitionId, user_id: userId },
    });
    return !!favorite;
  }

  // ========== STATISTIQUES ==========

  async getStats(userId: number) {
    const totalPartitions = await this.partitionRepository.count({
      where: { created_by: userId },
    });

    const totalDownloads = await this.partitionRepository
      .createQueryBuilder('partition')
      .select('SUM(partition.download_count)', 'total')
      .where('partition.created_by = :userId', { userId })
      .getRawOne();

    const totalViews = await this.partitionRepository
      .createQueryBuilder('partition')
      .select('SUM(partition.view_count)', 'total')
      .where('partition.created_by = :userId', { userId })
      .getRawOne();

    const totalFavorites = await this.favoriteRepository.count({
      where: { user_id: userId },
    });

    return {
      totalPartitions,
      totalDownloads: parseInt(totalDownloads.total) || 0,
      totalViews: parseInt(totalViews.total) || 0,
      totalFavorites,
    };
  }

  async getPopularPartitions(limit: number = 10) {
    return this.partitionRepository.find({
      where: { is_public: true, is_active: true },
      order: { download_count: 'DESC', view_count: 'DESC' },
      take: limit,
      relations: ['user'],
    });
  }
}
