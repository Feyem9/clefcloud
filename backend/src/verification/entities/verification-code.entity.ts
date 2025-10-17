import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum VerificationEventType {
  SIGNUP = 'SIGNUP',
  FORGOT_PASSWORD = 'FORGOT_PASSWORD',
  RESEND_CODE = 'RESEND_CODE',
  VERIFY_ATTRIBUTE = 'VERIFY_ATTRIBUTE',
  AUTHENTICATION = 'AUTHENTICATION',
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
  USED = 'USED',
}

@Entity('verification_codes')
@Index(['email', 'status'])
@Index(['userId'])
@Index(['createdAt'])
export class VerificationCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Identifiants utilisateur
  @Column({ name: 'user_id', nullable: true })
  userId?: string;

  @Column({ name: 'user_pool_id' })
  userPoolId: string;

  @Column()
  email: string;

  @Column({ name: 'phone_number', nullable: true })
  phoneNumber?: string;

  // Code de vérification
  @Column({ name: 'verification_code' })
  verificationCode: string;

  @Column({ name: 'verification_link', nullable: true, type: 'text' })
  verificationLink?: string;

  // Type et statut
  @Column({
    type: 'enum',
    enum: VerificationEventType,
    name: 'event_type',
  })
  eventType: VerificationEventType;

  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.PENDING,
  })
  status: VerificationStatus;

  // Métadonnées Cognito
  @Column({ name: 'trigger_source', nullable: true })
  triggerSource?: string;

  @Column({ name: 'lambda_request_id', nullable: true })
  lambdaRequestId?: string;

  @Column({ type: 'jsonb', name: 'user_attributes', nullable: true })
  userAttributes?: Record<string, any>;

  // Envoi d'email
  @Column({ name: 'email_sent_at', nullable: true, type: 'timestamp' })
  emailSentAt?: Date;

  @Column({ name: 'email_provider', nullable: true })
  emailProvider?: string; // 'SES' | 'SendGrid'

  @Column({ name: 'email_message_id', nullable: true })
  emailMessageId?: string;

  @Column({ name: 'email_error', nullable: true, type: 'text' })
  emailError?: string;

  // Tentatives
  @Column({ name: 'send_attempts', default: 0 })
  sendAttempts: number;

  @Column({ name: 'last_attempt_at', nullable: true, type: 'timestamp' })
  lastAttemptAt?: Date;

  // Expiration
  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  // Utilisation
  @Column({ name: 'used_at', nullable: true, type: 'timestamp' })
  usedAt?: Date;

  @Column({ name: 'used_by_ip', nullable: true })
  usedByIp?: string;

  // Timestamps
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Méthodes utilitaires
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  canRetry(): boolean {
    return this.sendAttempts < 3 && !this.isExpired();
  }

  markAsSent(provider: string, messageId: string): void {
    this.status = VerificationStatus.SENT;
    this.emailSentAt = new Date();
    this.emailProvider = provider;
    this.emailMessageId = messageId;
    this.sendAttempts++;
    this.lastAttemptAt = new Date();
  }

  markAsFailed(error: string): void {
    this.status = VerificationStatus.FAILED;
    this.emailError = error;
    this.sendAttempts++;
    this.lastAttemptAt = new Date();
  }

  markAsUsed(ipAddress?: string): void {
    this.status = VerificationStatus.USED;
    this.usedAt = new Date();
    this.usedByIp = ipAddress;
  }
}
