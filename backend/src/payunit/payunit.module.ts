import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PayunitService } from './payunit.service';
import { PayunitController } from './payunit.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from '../users/entities/transaction.entity';
import { User } from '../users/entities/user.entity';
import { UserPartition } from '../users/entities/user-partition.entity';
import { Partition } from '../partitions/entities/partition.entity';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([Transaction, User, UserPartition, Partition])],
  controllers: [PayunitController],
  providers: [PayunitService],
  exports: [PayunitService],
})
export class PayunitModule {}
