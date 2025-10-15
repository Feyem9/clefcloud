import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Partition } from '../partitions/entities/partition.entity';
import { CognitoUser } from '../auth/decorators/current-user.decorator';

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
   * Trouve ou crée un utilisateur à partir des informations Cognito
   */
  async findOrCreateFromCognito(cognitoUser: CognitoUser): Promise<User> {
    let user = await this.userRepository.findOne({
      where: { cognito_sub: cognitoUser.userId },
    });

    if (!user) {
      user = this.userRepository.create({
        cognito_sub: cognitoUser.userId,
        email: cognitoUser.email,
        username: cognitoUser.username,
        is_active: true,
      });
      user = await this.userRepository.save(user);
      this.logger.log(`New user created from Cognito: ${user.email}`);
    } else {
      // Mettre à jour last_login
      user.last_login = new Date();
      await this.userRepository.save(user);
    }

    return user;
  }

  /**
   * Trouve un utilisateur par son cognito_sub
   */
  async findByCognitoSub(cognitoSub: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { cognito_sub: cognitoSub },
    });
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'email', 'name', 'created_at'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findPartitions(id: number, limit: number = 50, offset: number = 0) {
    const user = await this.findOne(id);

    const [partitions, total] = await this.partitionRepository.findAndCount({
      where: { created_by: id },
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

    this.logger.log(`User updated: ${id}`);

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      created_at: updatedUser.created_at,
      updated_at: updatedUser.updated_at,
    };
  }
}
