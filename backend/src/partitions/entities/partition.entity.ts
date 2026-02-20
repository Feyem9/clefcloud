import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('partitions')
export class Partition {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  composer: string;

  @Column({ nullable: true })
  key: string;

  @Column()
  category: string;

  @Column({ nullable: true })
  messe_part: string;

  @Column('text', { array: true, default: [] })
  tags: string[];

  // Fichier PDF / Image de la partition
  @Column({ nullable: true })
  storage_path: string;

  @Column({ nullable: true })
  download_url: string;

  // Fichier Audio
  @Column({ nullable: true })
  audio_url: string;

  @Column({ nullable: true })
  audio_storage_path: string;

  // Image de couverture optionnelle
  @Column({ nullable: true })
  cover_url: string;

  @Column({ nullable: true })
  file_size: number;

  @Column({ nullable: true })
  file_type: string;

  @Column({ default: 0 })
  download_count: number;

  @Column({ default: 0 })
  view_count: number;

  @Column({ default: false })
  is_public: boolean;

  @Column({ default: true })
  is_active: boolean;

  @ManyToOne(() => User, (user) => user.partitions)
  @JoinColumn({ name: 'created_by' })
  user: User;

  @Column()
  created_by: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
