import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Partition } from '../../partitions/entities/partition.entity';

@Entity('user_partitions')
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
