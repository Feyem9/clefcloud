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
import { Testimonial } from '../../testimonials/entities/testimonial.entity';

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
  title: string;

  @Column({ nullable: true })
  avatar_url: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: false })
  is_premium: boolean;
  
  @Column({ default: false })
  is_admin: boolean;

  @Column({ type: 'timestamp', nullable: true })
  premium_until: Date;

  @Column({ nullable: true })
  last_login: Date;

  @OneToMany(() => Partition, (partition) => partition.user)
  partitions: Partition[];

  @OneToMany(() => Testimonial, (testimonial) => testimonial.user)
  testimonials: Testimonial[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Soft delete — l'utilisateur n'est pas supprimé physiquement de la DB
  @DeleteDateColumn()
  deleted_at: Date;
}
