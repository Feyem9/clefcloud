import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PartitionsController } from './partitions.controller';
import { PartitionsService } from './partitions.service';
import { Partition } from './entities/partition.entity';
import { Favorite } from './entities/favorite.entity';
import { User } from '../users/entities/user.entity';
import { UserPartition } from '../users/entities/user-partition.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Partition, Favorite, User, UserPartition]),
    AuthModule,
  ],
  controllers: [PartitionsController],
  providers: [PartitionsService],
  exports: [PartitionsService],
})
export class PartitionsModule {}
