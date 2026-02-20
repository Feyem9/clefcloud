import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Partition } from '../partitions/entities/partition.entity';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Partition)
    private partitionRepository: Repository<Partition>,
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

  async update(id: number, name: string) {
    const user = await this.findOne(id);

    user.name = name;
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
}
