import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Partition } from './entities/partition.entity';
import { CreatePartitionDto } from './dto/create-partition.dto';
import { User } from '../users/entities/user.entity';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class PartitionsService {
  private readonly logger = new Logger(PartitionsService.name);

  constructor(
    @InjectRepository(Partition)
    private partitionRepository: Repository<Partition>,
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

  async findOne(id: number) {
    const partition = await this.partitionRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!partition) throw new NotFoundException('Partition non trouvée');
    return partition;
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
