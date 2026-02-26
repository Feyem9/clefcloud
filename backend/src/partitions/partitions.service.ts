import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Partition } from './entities/partition.entity';
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
    @InjectRepository(UserPartition)
    private userPartitionRepository: Repository<UserPartition>,
    private firebaseService: FirebaseService,
  ) {}

  async create(
    createPartitionDto: CreatePartitionDto,
    user: User,
    files: { pdf?: Express.Multer.File[]; audio?: Express.Multer.File[] },
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
        const { storagePath, downloadUrl } = await this.firebaseService.uploadFile(
          user.id,
          files.pdf[0],
          `${baseFolder}/partition.pdf`,
        );
        savedPartition.storage_path = storagePath;
        // On peut aussi stocker l'URL directe pour simplifier le front
      }

      // 2. Gérer l'Audio
      if (files.audio && files.audio[0]) {
        const { storagePath, downloadUrl } = await this.firebaseService.uploadFile(
          user.id,
          files.audio[0],
          `${baseFolder}/demo.mp3`,
        );
        savedPartition.audio_storage_path = storagePath;
        savedPartition.audio_url = downloadUrl;
      }

      return await this.partitionRepository.save(savedPartition);
    } catch (error) {
      this.logger.error(`Erreur upload fichiers : ${error.message}`);
      // Optionnel : supprimer l'entrée DB si l'upload échoue
      throw error;
    }
  }

  async findAll(user: User) {
    // On récupère tout, mais on pourrait filtrer par visibilité
    return this.partitionRepository.find({
      relations: ['user'],
      order: { created_at: 'DESC' },
    });
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
    }

    return {
      ...partition,
      hasAccess,
    };
  }

  async remove(id: number, user: User) {
    const partition = await this.findOne(id);

    if (partition.created_by !== user.id) {
      throw new ForbiddenException('Vous ne pouvez supprimer que vos propres partitions');
    }

    // Supprimer les fichiers sur Firebase
    if (partition.storage_path) await this.firebaseService.deleteFile(partition.storage_path);
    if (partition.audio_storage_path) await this.firebaseService.deleteFile(partition.audio_storage_path);

    return this.partitionRepository.remove(partition);
  }

  // Les autres méthodes (favoris, recherche) restent similaires mais utilisent FirebaseService
}
