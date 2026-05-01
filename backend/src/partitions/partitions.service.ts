import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Partition } from './entities/partition.entity';
import { Favorite } from './entities/favorite.entity';
import { CreatePartitionDto } from './dto/create-partition.dto';
import { User } from '../users/entities/user.entity';
import { UserPartition } from '../users/entities/user-partition.entity';
import { FirebaseService } from '../firebase/firebase.service';

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
    private firebaseService: FirebaseService,
  ) {}

  async create(
    createPartitionDto: CreatePartitionDto,
    user: User,
    files: {
      pdf?: Express.Multer.File[];
      audio?: Express.Multer.File[];
      cover?: Express.Multer.File[];
    },
  ) {
    const partition = this.partitionRepository.create({
      ...createPartitionDto,
      user,
      created_by: user.id,
    });

    // On sauvegarde d'abord pour avoir l'ID
    const savedPartition = await this.partitionRepository.save(partition);
    const partitionId = savedPartition.id;

    // Dossier structuré : partitions/{userId}/{partitionId}/
    const baseFolder = `partitions/${user.id}/${partitionId}`;

    try {
      // 1. Gérer le PDF
      if (files.pdf && files.pdf[0]) {
        const { storagePath } = await this.firebaseService.uploadFile(
          user.id,
          files.pdf[0],
          `${baseFolder}/partition.pdf`,
        );
        savedPartition.storage_path = storagePath;
        savedPartition.download_url = null; // Plus de stockage d'URL publique
      }

      // 2. Gérer l'Audio
      if (files.audio && files.audio[0]) {
        const { storagePath } = await this.firebaseService.uploadFile(
          user.id,
          files.audio[0],
          `${baseFolder}/demo.mp3`,
        );
        savedPartition.audio_storage_path = storagePath;
        savedPartition.audio_url = null; // Plus de stockage d'URL publique
      }

      // 3. Gérer la cover (image publique de prévisualisation)
      if (files.cover && files.cover[0]) {
        const ext = files.cover[0].originalname.split('.').pop();
        const coverUrl = await this.firebaseService.uploadPublicFile(
          user.id,
          files.cover[0],
          `${baseFolder}/cover.${ext}`,
        );
        savedPartition.cover_url = coverUrl;
      }

      return await this.partitionRepository.save(savedPartition);
    } catch (error) {
      this.logger.error(`Erreur upload fichiers : ${error.message}`);
      // Optionnel : supprimer l'entrée DB si l'upload échoue
      throw error;
    }
  }

  async findAll(
    user: User,
    search?: string,
    category?: string,
    messePart?: string,
    limit = 50,
    offset = 0,
  ) {
    const query = this.partitionRepository
      .createQueryBuilder('partition')
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

    query.orderBy('partition.created_at', 'DESC').take(limit).skip(offset);

    const [partitions, total] = await query.getManyAndCount();

    // Ajouter l'info isFavorite pour chaque partition
    const favoriteIds = await this.favoriteRepository
      .find({
        where: { user_id: user.id },
        select: ['partition_id'],
      })
      .then((favs) => favs.map((f) => f.partition_id));

    return {
      data: partitions.map((p) => ({
        ...p,
        isFavorite: favoriteIds.includes(p.id),
      })),
      total,
      limit,
      offset,
    };
  }

  async findFavorites(user: User) {
    const favorites = await this.favoriteRepository.find({
      where: { user_id: user.id },
      relations: ['partition', 'partition.user'],
    });

    return favorites.map((f) => ({
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
      if (user.is_premium && (!user.premium_until || user.premium_until > new Date()))
        hasAccess = true;
      // 3. Il a acheté cette partition
      if (!hasAccess) {
        const purchase = await this.userPartitionRepository.findOneBy({
          user_id: user.id,
          partition_id: partition.id,
        });
        if (purchase) hasAccess = true;
      }
    }

    // Si pas d'accès, on cache les chemins de stockage
    if (!hasAccess) {
      partition.audio_url = null;
      partition.download_url = null;
      partition.storage_path = null;
      partition.audio_storage_path = null;
    } else {
      partition.download_url = null;
      partition.storage_path = null;
      partition.audio_storage_path = null;
      partition.audio_url = partition.audio_url ? 'available' : null;
    }

    // Info favorite
    const favorite = user
      ? await this.favoriteRepository.findOneBy({
          user_id: user.id,
          partition_id: partition.id,
        })
      : null;

    return {
      ...partition,
      hasAccess,
      isFavorite: !!favorite,
    };
  }

  /**
   * Génère une URL signée temporaire (15 min) pour télécharger une partition.
   * Vérifie les droits d'accès avant de générer l'URL.
   */
  async getDownloadUrl(id: number, user: User): Promise<{ url: string; expiresIn: number }> {
    const partition = await this.partitionRepository.findOneBy({ id });
    if (!partition) throw new NotFoundException('Partition non trouvée');

    // Vérification des droits
    let hasAccess = partition.created_by === user.id;
    if (!hasAccess && user.is_premium && (!user.premium_until || user.premium_until > new Date())) {
      hasAccess = true;
    }
    if (!hasAccess) {
      const purchase = await this.userPartitionRepository.findOneBy({
        user_id: user.id,
        partition_id: id,
      });
      if (purchase) hasAccess = true;
    }

    if (!hasAccess) {
      throw new ForbiddenException('Accès non autorisé à cette partition');
    }

    if (!partition.storage_path) {
      throw new NotFoundException('Fichier introuvable pour cette partition');
    }

    const EXPIRES_IN_MS = 15 * 60 * 1000; // 15 minutes
    const url = await this.firebaseService.getSignedUrl(partition.storage_path, EXPIRES_IN_MS);

    // Incrémenter le compteur de téléchargements
    await this.partitionRepository.increment({ id }, 'download_count', 1);

    return { url, expiresIn: 15 * 60 };
  }

  /**
   * Génère une URL signée temporaire pour l'audio (preview).
   * Accessible à tous les utilisateurs authentifiés (c'est un extrait de démo).
   */
  async getAudioUrl(id: number): Promise<{ url: string }> {
    const partition = await this.partitionRepository.findOneBy({ id });
    if (!partition) throw new NotFoundException('Partition non trouvée');
    if (!partition.audio_storage_path)
      throw new NotFoundException("Pas d'audio pour cette partition");

    const url = await this.firebaseService.getSignedUrl(
      partition.audio_storage_path,
      60 * 60 * 1000,
    ); // 1h pour l'audio
    return { url };
  }

  async remove(id: number, user: User) {
    const partition = await this.findOne(id);

    if (partition.created_by !== user.id) {
      throw new ForbiddenException('Vous ne pouvez supprimer que vos propres partitions');
    }

    // Supprimer les fichiers sur Firebase
    if (partition.storage_path) await this.firebaseService.deleteFile(partition.storage_path);
    if (partition.audio_storage_path)
      await this.firebaseService.deleteFile(partition.audio_storage_path);

    return this.partitionRepository.remove(partition);
  }

  // Les autres méthodes (favoris, recherche) restent similaires mais utilisent FirebaseService
}
