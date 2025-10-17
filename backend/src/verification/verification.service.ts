import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { VerificationCode, VerificationEventType, VerificationStatus } from './entities/verification-code.entity';
import { EmailService } from './email.service';

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(
    @InjectRepository(VerificationCode)
    private readonly verificationRepo: Repository<VerificationCode>,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Traiter un code de vérification reçu de Lambda
   */
  async processVerificationCode(data: {
    userId: string;
    userPoolId: string;
    email: string;
    phoneNumber?: string;
    verificationCode: string;
    verificationLink?: string;
    triggerSource: string;
    eventType: string;
    lambdaRequestId?: string;
    userAttributes?: any;
    receivedAt: Date;
  }) {
    this.logger.log(`📝 Traitement du code pour: ${data.email}`);

    try {
      // Calculer l'expiration (24h pour signup, 1h pour forgot password)
      const expiresAt = new Date();
      if (data.eventType === 'SIGNUP' || data.eventType === 'RESEND_CODE') {
        expiresAt.setHours(expiresAt.getHours() + 24);
      } else {
        expiresAt.setHours(expiresAt.getHours() + 1);
      }

      // Créer l'enregistrement
      const verification = this.verificationRepo.create({
        userId: data.userId,
        userPoolId: data.userPoolId,
        email: data.email,
        phoneNumber: data.phoneNumber,
        verificationCode: data.verificationCode,
        verificationLink: data.verificationLink,
        triggerSource: data.triggerSource,
        eventType: data.eventType as VerificationEventType,
        lambdaRequestId: data.lambdaRequestId,
        userAttributes: data.userAttributes,
        expiresAt,
        status: VerificationStatus.PENDING,
      });

      // Sauvegarder dans PostgreSQL
      const saved = await this.verificationRepo.save(verification);
      this.logger.log(`✅ Code sauvegardé en base - ID: ${saved.id}`);

      // Envoyer l'email de manière asynchrone
      this.sendVerificationEmail(saved).catch((error) => {
        this.logger.error(`❌ Erreur lors de l'envoi de l'email:`, error);
      });

      return saved;

    } catch (error) {
      this.logger.error(`❌ Erreur lors du traitement:`, error);
      throw error;
    }
  }

  /**
   * Envoyer l'email de vérification
   */
  private async sendVerificationEmail(verification: VerificationCode) {
    try {
      this.logger.log(`📧 Envoi de l'email à: ${verification.email}`);

      const result = await this.emailService.sendVerificationEmail({
        to: verification.email,
        code: verification.verificationCode,
        eventType: verification.eventType,
        expiresAt: verification.expiresAt,
      });

      // Mettre à jour le statut
      verification.markAsSent(result.provider, result.messageId);
      await this.verificationRepo.save(verification);

      this.logger.log(`✅ Email envoyé avec succès - Provider: ${result.provider}, ID: ${result.messageId}`);

    } catch (error) {
      this.logger.error(`❌ Échec de l'envoi de l'email:`, error);

      // Marquer comme échoué
      verification.markAsFailed(error.message);
      await this.verificationRepo.save(verification);

      throw error;
    }
  }

  /**
   * Récupérer tous les codes (pour l'interface admin)
   */
  async findAll(options?: {
    limit?: number;
    offset?: number;
    status?: VerificationStatus;
    eventType?: VerificationEventType;
    email?: string;
  }) {
    const query = this.verificationRepo.createQueryBuilder('vc');

    if (options?.status) {
      query.andWhere('vc.status = :status', { status: options.status });
    }

    if (options?.eventType) {
      query.andWhere('vc.eventType = :eventType', { eventType: options.eventType });
    }

    if (options?.email) {
      query.andWhere('vc.email ILIKE :email', { email: `%${options.email}%` });
    }

    query
      .orderBy('vc.createdAt', 'DESC')
      .limit(options?.limit || 50)
      .offset(options?.offset || 0);

    const [items, total] = await query.getManyAndCount();

    return {
      items,
      total,
      limit: options?.limit || 50,
      offset: options?.offset || 0,
    };
  }

  /**
   * Récupérer un code par ID
   */
  async findOne(id: string) {
    return this.verificationRepo.findOne({ where: { id } });
  }

  /**
   * Récupérer les codes d'un utilisateur
   */
  async findByEmail(email: string) {
    return this.verificationRepo.find({
      where: { email },
      order: { createdAt: 'DESC' },
      take: 10,
    });
  }

  /**
   * Marquer un code comme utilisé
   */
  async markAsUsed(id: string, ipAddress?: string) {
    const verification = await this.findOne(id);
    
    if (!verification) {
      throw new Error('Code not found');
    }

    verification.markAsUsed(ipAddress);
    return this.verificationRepo.save(verification);
  }

  /**
   * Réessayer l'envoi d'un email échoué
   */
  async retryEmail(id: string) {
    const verification = await this.findOne(id);

    if (!verification) {
      throw new Error('Code not found');
    }

    if (!verification.canRetry()) {
      throw new Error('Cannot retry: max attempts reached or expired');
    }

    await this.sendVerificationEmail(verification);
    return verification;
  }

  /**
   * Nettoyer les codes expirés (à exécuter périodiquement)
   */
  async cleanupExpired() {
    const result = await this.verificationRepo.update(
      {
        status: VerificationStatus.PENDING,
        expiresAt: LessThan(new Date()),
      },
      {
        status: VerificationStatus.EXPIRED,
      },
    );

    this.logger.log(`🧹 ${result.affected} codes expirés nettoyés`);
    return result.affected;
  }

  /**
   * Statistiques
   */
  async getStats() {
    const [
      total,
      pending,
      sent,
      failed,
      expired,
      used,
    ] = await Promise.all([
      this.verificationRepo.count(),
      this.verificationRepo.count({ where: { status: VerificationStatus.PENDING } }),
      this.verificationRepo.count({ where: { status: VerificationStatus.SENT } }),
      this.verificationRepo.count({ where: { status: VerificationStatus.FAILED } }),
      this.verificationRepo.count({ where: { status: VerificationStatus.EXPIRED } }),
      this.verificationRepo.count({ where: { status: VerificationStatus.USED } }),
    ]);

    // Stats des dernières 24h
    const last24h = new Date();
    last24h.setHours(last24h.getHours() - 24);

    const recentCount = await this.verificationRepo.count({
      where: { createdAt: MoreThan(last24h) },
    });

    return {
      total,
      byStatus: {
        pending,
        sent,
        failed,
        expired,
        used,
      },
      last24h: recentCount,
    };
  }
}
