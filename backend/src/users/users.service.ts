import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Partition } from '../partitions/entities/partition.entity';
import { Favorite } from '../partitions/entities/favorite.entity';
import { UserPartition } from './entities/user-partition.entity';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Partition)
    private partitionRepository: Repository<Partition>,
    @InjectRepository(Favorite)
    private favoriteRepository: Repository<Favorite>,
    @InjectRepository(UserPartition)
    private userPartitionRepository: Repository<UserPartition>,
  ) {}

  /**
   * Trouve un utilisateur à partir de son UID Firebase (stocké dans cognito_sub)
   */
  async findByFirebaseUid(uid: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { cognito_sub: uid },
    });
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'email', 'name', 'created_at'],
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    return user;
  }

  async findPartitions(id: number, limit: number = 50, offset: number = 0) {
    const [partitions, total] = await this.partitionRepository.findAndCount({
      where: { user: { id } },
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

  async getProfileStats(user: User) {
    const userId = user.id;

    // 1. Statistiques des partitions créées par l'utilisateur
    const partitions = await this.partitionRepository.find({
      where: { created_by: userId },
    });

    const totalPartitions = partitions.length;
    const totalDownloads = partitions.reduce((sum, p) => sum + (p.download_count || 0), 0);
    const totalViews = partitions.reduce((sum, p) => sum + (p.view_count || 0), 0);

    // 2. Nombre de favoris (partitions que l'utilisateur a likées)
    const totalFavorites = await this.favoriteRepository.count({
      where: { user_id: userId },
    });

    // 3. Partitions récentes de l'utilisateur
    const recentUploads = await this.partitionRepository.find({
      where: { created_by: userId },
      order: { created_at: 'DESC' },
      take: 5,
    });

    // 4. Historique des achats
    const purchases = await this.userPartitionRepository.find({
      where: { user_id: userId },
      relations: ['partition', 'partition.user'],
      order: { created_at: 'DESC' },
    });

    return {
      totalPartitions,
      totalDownloads,
      totalViews,
      totalFavorites,
      recentUploads,
      purchases: purchases.map(p => ({
        ...p.partition,
        purchased_at: p.created_at,
      })),
    };
  }

  async update(id: number, data: { name?: string; title?: string; avatar_url?: string }) {
    const user = await this.findOne(id);

    if (data.name) user.name = data.name;
    if (data.title !== undefined) user.title = data.title;
    if (data.avatar_url !== undefined) user.avatar_url = data.avatar_url;
    
    user.updated_at = new Date();

    const updatedUser = await this.userRepository.save(user);

    this.logger.log(`Utilisateur mis à jour : ${id}`);

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      created_at: updatedUser.created_at,
      updated_at: updatedUser.updated_at,
    };
  }

  async deleteUser(id: number) {
    const user = await this.findOne(id);
    // Supprimer l'utilisateur de la base de données.
    // L'ON DELETE CASCADE défini dans la DB s'occupera des favoris et partitions associées, 
    // ou lever une erreur s'il y a des violations de contrainte à gérer.
    await this.userRepository.delete(user.id);
    this.logger.log(`Utilisateur supprimé : ${id}`);
    return { success: true };
  }
}
