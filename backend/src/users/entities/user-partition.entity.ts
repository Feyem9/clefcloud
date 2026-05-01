import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Partition } from '../../partitions/entities/partition.entity';

@Entity('user_partitions')
@Index('idx_user_partitions_user_id', ['user_id'])
@Index('idx_user_partitions_partition_id', ['partition_id'])
export class UserPartition {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  user_id: number;

  @ManyToOne(() => Partition)
  @JoinColumn({ name: 'partition_id' })
  partition: Partition;

  @Column()
  partition_id: number;

  @CreateDateColumn()
  created_at: Date;
}
