import { Controller, Post, Body, Get, Query, Req, UseGuards, BadRequestException, Logger } from '@nestjs/common';
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

@Controller('payments')
export class PayunitController {
  private readonly logger = new Logger(PayunitController.name);

  constructor(
    private readonly payunitService: PayunitService,
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
   * Webhook appelé par PayUnit après le paiement
   */
  @Public()
  @Post('callback')
  async handleCallback(@Body() body: PayunitCallbackDto) {
    // Note: Dans une version réelle, il faudrait vérifier la signature/IP de PayUnit
    const { transaction_id, payunit_transaction_id, status } = body;

    // FIX: Nettoyer l'ID de transaction (ex: "32-CLEFCLOUD" -> 32)
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
}
