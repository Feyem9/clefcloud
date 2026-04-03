import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('site_content')
export class SiteContent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  section: string; // e.g. 'about_us'

  @Column({ type: 'text' })
  content: string;

  @UpdateDateColumn()
  updated_at: Date;
}
