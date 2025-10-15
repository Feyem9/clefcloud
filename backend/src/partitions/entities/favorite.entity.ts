import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Column,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Partition } from './partition.entity';

@Entity('favorites')
@Unique(['user_id', 'partition_id'])
export class Favorite {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column()
  partition_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Partition)
  @JoinColumn({ name: 'partition_id' })
  partition: Partition;

  @CreateDateColumn()
  created_at: Date;
}
