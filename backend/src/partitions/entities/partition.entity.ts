import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('partitions')
@Index('idx_partitions_created_by', ['created_by'])
@Index('idx_partitions_category', ['category'])
@Index('idx_partitions_is_active', ['is_active'])
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

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ nullable: true })
  messe_part: string;

  @Column('text', { array: true, default: [] })
  tags: string[];

  // Fichier PDF / Image de la partition
  @Column({ nullable: true, type: 'varchar' })
  storage_path: string | null;

  @Column({ nullable: true, type: 'varchar' })
  download_url: string | null;

  // Fichier Audio
  @Column({ nullable: true, type: 'varchar' })
  audio_url: string | null;

  @Column({ nullable: true, type: 'varchar' })
  audio_storage_path: string | null;

  // Image de couverture optionnelle
  @Column({ nullable: true, type: 'varchar' })
  cover_url: string | null;

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
