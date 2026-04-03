import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Transaction } from './entities/transaction.entity';
import { UserPartition } from './entities/user-partition.entity';
import { Partition } from '../partitions/entities/partition.entity';
import { Favorite } from '../partitions/entities/favorite.entity';
import { AuthModule } from '../auth/auth.module';
import { R2Module } from '../r2/r2.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Partition, Transaction, UserPartition, Favorite]),
    R2Module,
    forwardRef(() => AuthModule),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
