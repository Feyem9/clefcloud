import { Controller, Post, Body, Get, Req, BadRequestException, Logger, Param } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PayunitService } from './payunit.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../users/entities/transaction.entity';
import { User } from '../users/entities/user.entity';
import { UserPartition } from '../users/entities/user-partition.entity';
import { Partition } from '../partitions/entities/partition.entity';
import { Public } from '../common/decorators/public.decorator';
import { TransactionStatus, TransactionType } from '../common/enums/transaction.enum';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';
import { PayunitCallbackDto } from './dto/payunit-callback.dto';
import { DeepPartial } from 'typeorm';

import { PaymentVerificationService } from './payment-verification.service';

@Controller('payments')
export class PayunitController {
  private readonly logger = new Logger(PayunitController.name);

  constructor(
    private readonly payunitService: PayunitService,
    private readonly paymentVerificationService: PaymentVerificationService,
    private readonly configService: ConfigService,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Partition)
    private partitionRepository: Repository<Partition>,
  ) {}

  /**
   * Initialise un achat de partition
   */
  @Post('checkout/partition')
  async checkoutPartition(@Body() body: { partitionId: number }, @Req() req: RequestWithUser) {
    const userId = req.user.id;
    const partition = await this.partitionRepository.findOneBy({ id: body.partitionId });

    if (!partition) {
      throw new BadRequestException('Partition introuvable');
    }

    // Prix fixe pour toutes les partitions (ignore la valeur en base qui peut être 0 pour les anciennes)
    const FIXED_PRICE = 599;

    // 1. Créer une transaction en attente
    const transactionData: DeepPartial<Transaction> = {
      user_id: userId,
      type: TransactionType.PARTITION,
      amount: FIXED_PRICE,
      partition_id: partition.id,
      status: TransactionStatus.PENDING,
    };
    const transaction = this.transactionRepository.create(transactionData);
    await this.transactionRepository.save(transaction);

    // 2. Appeler PayUnit
    const payunitResponse = await this.payunitService.initializePayment(
      FIXED_PRICE,
      `${transaction.id}-CLEFCLOUD`,
      `Achat de la partition : ${partition.title}`
    );

    return payunitResponse;
  }

  /**
   * Initialise un abonnement Premium
   */
  @Post('checkout/premium')
  async checkoutPremium(@Req() req: RequestWithUser) {
    const userId = req.user.id;
    const premiumPrice = 5000; // Exemple : 5000 FCFA pour Premium

    const transactionData: DeepPartial<Transaction> = {
      user_id: userId,
      type: TransactionType.PREMIUM,
      amount: premiumPrice,
      status: TransactionStatus.PENDING,
    };
    const transaction = this.transactionRepository.create(transactionData);
    await this.transactionRepository.save(transaction);

    const payunitResponse = await this.payunitService.initializePayment(
      premiumPrice,
      `${transaction.id}-CLEFCLOUD`,
      'Abonnement ClefCloud Premium'
    );

    return payunitResponse;
  }

  /**
   * Webhook appelé par PayUnit après le paiement.
   *
   * SÉCURITÉ : PayUnit ne supporte pas les headers personnalisés dans leur dashboard.
   * On sécurise donc en re-vérifiant le statut directement auprès de PayUnit
   * avant d'honorer le paiement — un faux webhook ne peut pas passer cette vérification.
   */
  @Public()
  @Post('callback')
  async handleCallback(@Body() body: PayunitCallbackDto, @Req() req) {
    const clientIp = req.ip || req.headers['x-forwarded-for'];
    const { transaction_id, payunit_transaction_id, status } = body;

    this.logger.log(`Webhook reçu depuis IP ${clientIp} — transaction_id: ${transaction_id}, status: ${status}`);

    // Nettoyer l'ID de transaction (ex: "32-CLEFCLOUD" -> 32)
    const cleanIdString = transaction_id ? transaction_id.toString().split('-')[0] : '';
    const cleanId = parseInt(cleanIdString);

    if (!cleanId || isNaN(cleanId)) {
      this.logger.error(`ID de transaction invalide reçu : ${transaction_id}`);
      return { message: 'ID de transaction invalide' };
    }

    const transaction = await this.transactionRepository.findOneBy({ id: cleanId });

    if (!transaction) {
      this.logger.error(`Transaction non trouvée en base pour ID : ${cleanId}`);
      return { message: 'Transaction non trouvée' };
    }

    if (transaction.status !== TransactionStatus.PENDING) {
      return { message: 'Transaction déjà traitée' };
    }

    // SÉCURITÉ : Re-vérifier le statut directement auprès de PayUnit
    // Cela empêche les faux webhooks — si quelqu'un appelle cet endpoint manuellement,
    // PayUnit répondra UNKNOWN ou FAILED pour cette transaction.
    if (payunit_transaction_id) {
      const verification = await this.payunitService.checkTransactionStatus(payunit_transaction_id);
      const verifiedStatus = verification.status?.toUpperCase();

      if (verifiedStatus !== 'SUCCESS' && verifiedStatus !== 'COMPLETE') {
        this.logger.warn(
          `Webhook rejeté — statut PayUnit vérifié: ${verifiedStatus} pour transaction ${cleanId} (IP: ${clientIp})`
        );
        return { message: 'Paiement non confirmé par PayUnit' };
      }
      this.logger.log(`Paiement confirmé par PayUnit pour transaction ${cleanId}`);
    }

    const normalizedStatus = status?.toUpperCase();

    if (normalizedStatus === 'SUCCESS' || normalizedStatus === 'COMPLETE') {
      transaction.status = TransactionStatus.SUCCESS;
      transaction.payunit_transaction_id = payunit_transaction_id;
      await this.transactionRepository.save(transaction);

      // Si c'est un abonnement premium
      if (transaction.type === TransactionType.PREMIUM) {
        const user = await this.userRepository.findOneBy({ id: transaction.user_id });
        user.is_premium = true;
        // Ajouter 30 jours (exemple)
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 30);
        user.premium_until = expiry;
        await this.userRepository.save(user);
      }
      
      // Si c'est l'achat d'une partition individuelle
      if (transaction.type === TransactionType.PARTITION && transaction.partition_id) {
        // Accorder l'accès permanent à cette partition
        const userPartition = this.transactionRepository.manager.create(UserPartition, {
          user_id: transaction.user_id,
          partition_id: transaction.partition_id
        });
        await this.transactionRepository.manager.save(userPartition);
      }
    } else {
      transaction.status = TransactionStatus.FAILED;
      await this.transactionRepository.save(transaction);
    }

    return { status: 'ok' };
  }

  /**
   * Récupère l'historique des transactions de l'utilisateur
   */
  @Get('my-transactions')
  async getMyTransactions(@Req() req: RequestWithUser) {
    return this.transactionRepository.find({
      where: { user_id: req.user.id },
      order: { created_at: 'DESC' },
      relations: ['partition'],
    });
  }

  /**
   * Force la vérification d'une transaction manuellement par l'utilisateur
   */
  @Post('verify/:id')
  async verifyPayment(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.paymentVerificationService.verifyAndFulfill(parseInt(id), req.user.id);
  }

  /**
   * ADMIN : Récupère toutes les transactions du système
   */
  @Get('admin/transactions')
  async getAllTransactionsAdmin(@Req() req: RequestWithUser) {
    if (!req.user.is_admin) throw new BadRequestException('Accès refusé');

    return this.transactionRepository.find({
      order: { created_at: 'DESC' },
      relations: ['user', 'partition'],
    });
  }

  /**
   * ADMIN : Force le déblocage d'une transaction, indépendamment de son statut PayUnit
   */
  @Post('admin/force-unlock/:id')
  async forceUnlockAdmin(@Param('id') id: string, @Req() req: RequestWithUser) {
    if (!req.user.is_admin) throw new BadRequestException('Accès refusé');
    
    return this.paymentVerificationService.forceUnlock(parseInt(id));
  }
}
