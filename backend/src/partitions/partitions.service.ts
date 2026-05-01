import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Partition } from './entities/partition.entity';
import { Favorite } from './entities/favorite.entity';
import { CreatePartitionDto } from './dto/create-partition.dto';
import { User } from '../users/entities/user.entity';
import { UserPartition } from '../users/entities/user-partition.entity';
import { R2Service } from '../r2/r2.service';

@Injectable()
export class PartitionsService {
  private readonly logger = new Logger(PartitionsService.name);

  constructor(
    @InjectRepository(Partition)
    private partitionRepository: Repository<Partition>,
    @InjectRepository(Favorite)
    private favoriteRepository: Repository<Favorite>,
    @InjectRepository(UserPartition)
    private userPartitionRepository: Repository<UserPartition>,
    private r2Service: R2Service,
  ) {}

  async create(
    createPartitionDto: CreatePartitionDto,
    user: User,
    files: {
      pdf?: Express.Multer.File[];
      lyrics?: Express.Multer.File[];
      audio?: Express.Multer.File[];
      cover?: Express.Multer.File[];
    },
  ) {
    if (!user.is_admin) {
      throw new ForbiddenException('Seul l\'administrateur peut ajouter des partitions');
    }

    if (!files.pdf?.[0] && !files.lyrics?.[0]) {
      throw new ForbiddenException('Au moins un fichier PDF (partition ou paroles) est requis');
    }

    const partition = this.partitionRepository.create({
      ...createPartitionDto,
      price: 599,
      user,
      created_by: user.id,
    });

    const savedPartition = await this.partitionRepository.save(partition);
    const partitionId = savedPartition.id;
    const baseFolder = `partitions/${user.id}/${partitionId}`;

    try {
      // 1. PDF Partition
      if (files.pdf?.[0]) {
        const { storagePath, downloadUrl } = await this.r2Service.uploadFile(
          user.id, files.pdf[0], `${baseFolder}/partition.pdf`,
        );
        savedPartition.storage_path = storagePath;
        savedPartition.download_url = downloadUrl;
      }

      // 2. PDF Paroles
      if (files.lyrics?.[0]) {
        const { storagePath, downloadUrl } = await this.r2Service.uploadFile(
          user.id, files.lyrics[0], `${baseFolder}/paroles.pdf`,
        );
        savedPartition.lyrics_storage_path = storagePath;
        savedPartition.lyrics_url = downloadUrl;
      }

      // 3. Audio
      if (files.audio?.[0]) {
        const { storagePath, downloadUrl } = await this.r2Service.uploadFile(
          user.id, files.audio[0], `${baseFolder}/demo.mp3`,
        );
        savedPartition.audio_storage_path = storagePath;
        savedPartition.audio_url = downloadUrl;
      }

      // 4. Image de couverture
      if (files.cover?.[0]) {
        const { storagePath, downloadUrl } = await this.r2Service.uploadFile(
          user.id, files.cover[0], `${baseFolder}/cover.jpg`,
        );
        savedPartition.cover_url = downloadUrl;
      }

      return await this.partitionRepository.save(savedPartition);
    } catch (error) {
      this.logger.error(`Erreur upload fichiers : ${error.message}`);
      throw error;
    }
  }

  async findAll(user: User, search?: string, category?: string, messePart?: string, page = 1, limit = 20) {
    const now = new Date();
    const isPremium = user.is_premium && (!user.premium_until || new Date(user.premium_until) > now);

    const query = this.partitionRepository.createQueryBuilder('partition')
      .leftJoinAndSelect('partition.user', 'user')
      .where('partition.is_active = :isActive', { isActive: true });

    if (search) {
      query.andWhere(
        '(LOWER(partition.title) LIKE LOWER(:search) OR LOWER(partition.composer) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    if (category && category !== 'all') {
      query.andWhere('partition.category = :category', { category });
    }

    if (messePart && messePart !== 'all') {
      query.andWhere('partition.messe_part = :messePart', { messePart });
    }

    query.orderBy('partition.created_at', 'DESC');

    // Pagination
    const total = await query.getCount();
    const partitions = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    const favoriteIds = await this.favoriteRepository.find({
      where: { user_id: user.id },
      select: ['partition_id'],
    }).then(favs => favs.map(f => f.partition_id));

    const purchasedIds = await this.userPartitionRepository.find({
      where: { user_id: user.id },
      select: ['partition_id'],
    }).then(ups => ups.map(up => up.partition_id));

    const data = partitions.map(p => {
      const isOwner = p.created_by === user.id;
      const isPurchased = purchasedIds.includes(p.id);
      const hasAccess = isPremium || isOwner || user.is_admin || isPurchased;

      return {
        ...p,
        isFavorite: favoriteIds.includes(p.id),
        hasAccess,
        download_url: hasAccess ? p.download_url : null,
        audio_url: hasAccess ? p.audio_url : null,
        storage_path: hasAccess ? p.storage_path : null,
        audio_storage_path: hasAccess ? p.audio_storage_path : null,
        lyrics_url: hasAccess ? p.lyrics_url : null,
        lyrics_storage_path: hasAccess ? p.lyrics_storage_path : null,
      };
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

  async findFavorites(user: User) {
    const favorites = await this.favoriteRepository.find({
      where: { user_id: user.id },
      relations: ['partition', 'partition.user'],
    });

    return favorites.map(f => ({
      ...f.partition,
      isFavorite: true,
    }));
  }

  async toggleFavorite(partitionId: number, user: User) {
    const favorite = await this.favoriteRepository.findOne({
      where: { user_id: user.id, partition_id: partitionId },
    });

    if (favorite) {
      await this.favoriteRepository.remove(favorite);
      return { isFavorite: false };
    } else {
      const newFavorite = this.favoriteRepository.create({
        user_id: user.id,
        partition_id: partitionId,
      });
      await this.favoriteRepository.save(newFavorite);
      return { isFavorite: true };
    }
  }

  async findOne(id: number, user?: User) {
    const partition = await this.partitionRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!partition) throw new NotFoundException('Partition non trouvée');

    // Vérification des droits d'accès
    let hasAccess = false;

    if (user) {
      // 1. Il est l'auteur
      if (partition.created_by === user.id) hasAccess = true;
      // 2. Il est Premium
      if (user.is_premium && (!user.premium_until || user.premium_until > new Date())) hasAccess = true;
      // 3. Il a acheté cette partition
      if (!hasAccess) {
        const purchase = await this.userPartitionRepository.findOneBy({
          user_id: user.id,
          partition_id: partition.id,
        });
        if (purchase) hasAccess = true;
      }
    }

    // Si pas d'accès, on cache les URLs de téléchargement et audio
    if (!hasAccess) {
      delete partition.audio_url;
      delete partition.download_url;
      delete partition.storage_path;
      delete partition.audio_storage_path;
      delete partition.lyrics_url;
      delete partition.lyrics_storage_path;
    }

    // Info favorite
    const favorite = user ? await this.favoriteRepository.findOneBy({
      user_id: user.id,
      partition_id: partition.id,
    }) : null;

    return {
      ...partition,
      hasAccess,
      isFavorite: !!favorite,
    };
  }

  async remove(id: number, user: User) {
    const partition = await this.findOne(id);

    if (partition.created_by !== user.id) {
      throw new ForbiddenException('Vous ne pouvez supprimer que vos propres partitions');
    }

    // Supprimer les fichiers sur R2
    if (partition.storage_path) await this.r2Service.deleteFile(partition.storage_path);
    if (partition.audio_storage_path) await this.r2Service.deleteFile(partition.audio_storage_path);

    return this.partitionRepository.remove(partition);
  }

  async getDownloadUrl(id: number, user: User) {
    const partition = await this.findOne(id, user);

    if (!partition.hasAccess) {
      throw new ForbiddenException('Vous n\'avez pas accès à cette partition');
    }

    if (!partition.download_url) {
      throw new NotFoundException('Aucun fichier associé à cette partition');
    }

    // Si le fichier est sur R2, on génère une URL signée pour contourner les erreurs CORS/401
    if (partition.download_url.includes('r2.dev') && partition.storage_path) {
      const presignedUrl = await this.r2Service.getPresignedUrl(partition.storage_path, 3600);
      return { url: presignedUrl };
    }

    return { url: partition.download_url };
  }
}
