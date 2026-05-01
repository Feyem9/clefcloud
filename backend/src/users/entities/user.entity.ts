import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { Partition } from '../../partitions/entities/partition.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  firebase_uid: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  username: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  avatar_url: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: false })
  is_premium: boolean;

  @Column({ type: 'timestamp', nullable: true })
  premium_until: Date;

  @Column({ nullable: true })
  last_login: Date;

  @OneToMany(() => Partition, (partition) => partition.user)
  partitions: Partition[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Soft delete : rempli lors de la suppression, null sinon
  @DeleteDateColumn({ nullable: true })
  deleted_at: Date | null;
}
