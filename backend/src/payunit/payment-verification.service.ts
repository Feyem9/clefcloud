import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { Transaction } from '../users/entities/transaction.entity';
import { User } from '../users/entities/user.entity';
import { UserPartition } from '../users/entities/user-partition.entity';
import { PayunitService } from './payunit.service';
import { TransactionStatus, TransactionType } from '../common/enums/transaction.enum';

@Injectable()
export class PaymentVerificationService {
  private readonly logger = new Logger(PaymentVerificationService.name);

  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private payunitService: PayunitService,
  ) {}

  /**
   * CRON : Vérifie les transactions en attente toutes les 5 minutes
   */
  @Cron('*/5 * * * *')
  async verifyPendingTransactions() {
    this.logger.log('🔄 CRON : Vérification des transactions en attente...');

    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    // Récupérer les transactions PENDING
    const pendingTransactions = await this.transactionRepository.find({
      where: {
        status: TransactionStatus.PENDING,
      },
    });

    if (pendingTransactions.length === 0) {
      this.logger.log('✅ Aucune transaction en attente.');
      return;
    }

    this.logger.log(`🔍 ${pendingTransactions.length} transaction(s) en attente à vérifier.`);

    for (const transaction of pendingTransactions) {
      try {
        // Si la transaction a plus de 24h, on l'expire
        if (transaction.created_at < twentyFourHoursAgo) {
          this.logger.warn(`⏰ Transaction ${transaction.id} expirée (> 24h).`);
          transaction.status = TransactionStatus.EXPIRED;
          await this.transactionRepository.save(transaction);
          continue;
        }

        // Sinon, on vérifie auprès de PayUnit
        const payunitTransactionId = `${transaction.id}-CLEFCLOUD`;
        const result = await this.payunitService.checkTransactionStatus(payunitTransactionId);

        if (result.status === 'SUCCESS' || result.status === 'COMPLETE') {
          this.logger.log(`✅ Transaction ${transaction.id} confirmée par PayUnit !`);
          await this.fulfillTransaction(transaction);
        } else if (result.status === 'FAILED' || result.status === 'CANCELLED') {
          this.logger.warn(`❌ Transaction ${transaction.id} échouée chez PayUnit.`);
          transaction.status = TransactionStatus.FAILED;
          await this.transactionRepository.save(transaction);
        } else {
          this.logger.log(`⏳ Transaction ${transaction.id} toujours en attente chez PayUnit.`);
        }
      } catch (error) {
        this.logger.error(`Erreur vérification transaction ${transaction.id}: ${error.message}`);
      }
    }
  }

  /**
   * Vérifie et débloque une transaction spécifique (appelé par l'utilisateur ou l'admin)
   */
  async verifyAndFulfill(transactionId: number, userId?: number): Promise<{ success: boolean; message: string }> {
    const whereClause: any = { id: transactionId };
    if (userId) whereClause.user_id = userId; // Sécurité : l'utilisateur ne peut vérifier que ses propres transactions

    const transaction = await this.transactionRepository.findOneBy(whereClause);

    if (!transaction) {
      return { success: false, message: 'Transaction introuvable' };
    }

    if (transaction.status === TransactionStatus.SUCCESS) {
      return { success: true, message: 'Transaction déjà validée' };
    }

    if (transaction.status !== TransactionStatus.PENDING) {
      return { success: false, message: `Transaction en statut ${transaction.status}, impossible de vérifier` };
    }

    // Vérifier auprès de PayUnit
    const payunitTransactionId = `${transaction.id}-CLEFCLOUD`;
    const result = await this.payunitService.checkTransactionStatus(payunitTransactionId);

    if (result.status === 'SUCCESS' || result.status === 'COMPLETE') {
      await this.fulfillTransaction(transaction);
      return { success: true, message: 'Paiement confirmé ! Accès débloqué.' };
    } else if (result.status === 'FAILED' || result.status === 'CANCELLED') {
      transaction.status = TransactionStatus.FAILED;
      await this.transactionRepository.save(transaction);
      return { success: false, message: 'Le paiement a échoué chez PayUnit.' };
    }

    return { success: false, message: 'Paiement toujours en attente chez PayUnit. Réessayez dans quelques minutes.' };
  }

  /**
   * Force le déblocage d'une transaction (admin only)
   */
  async forceUnlock(transactionId: number): Promise<{ success: boolean; message: string }> {
    const transaction = await this.transactionRepository.findOneBy({ id: transactionId });

    if (!transaction) {
      return { success: false, message: 'Transaction introuvable' };
    }

    if (transaction.status === TransactionStatus.SUCCESS) {
      return { success: true, message: 'Transaction déjà validée' };
    }

    await this.fulfillTransaction(transaction);
    return { success: true, message: `Transaction ${transactionId} débloquée avec succès.` };
  }

  /**
   * Logique commune : valider une transaction et débloquer l'accès
   */
  private async fulfillTransaction(transaction: Transaction) {
    transaction.status = TransactionStatus.SUCCESS;
    await this.transactionRepository.save(transaction);

    // Si c'est un abonnement premium
    if (transaction.type === TransactionType.PREMIUM) {
      const user = await this.userRepository.findOneBy({ id: transaction.user_id });
      if (user) {
        user.is_premium = true;
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 30);
        user.premium_until = expiry;
        await this.userRepository.save(user);
        this.logger.log(`👑 Utilisateur ${user.email} promu Premium jusqu'au ${expiry.toISOString()}`);
      }
    }

    // Si c'est l'achat d'une partition individuelle
    if (transaction.type === TransactionType.PARTITION && transaction.partition_id) {
      const existing = await this.transactionRepository.manager.findOneBy(UserPartition, {
        user_id: transaction.user_id,
        partition_id: transaction.partition_id,
      });

      if (!existing) {
        const userPartition = this.transactionRepository.manager.create(UserPartition, {
          user_id: transaction.user_id,
          partition_id: transaction.partition_id,
        });
        await this.transactionRepository.manager.save(userPartition);
        this.logger.log(`🎵 Partition ${transaction.partition_id} débloquée pour user ${transaction.user_id}`);
      }
    }
  }
}
