import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Req,
  BadRequestException,
  Headers,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PayunitService } from './payunit.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../users/entities/transaction.entity';
import { User } from '../users/entities/user.entity';
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
    const userId = req.user.id; // Récupéré via le Firebase Guard global
    const partition = await this.partitionRepository.findOneBy({ id: body.partitionId });

    if (!partition) {
      throw new BadRequestException('Partition introuvable');
    }

    // 1. Créer une transaction en attente
    const transactionData: DeepPartial<Transaction> = {
      user_id: userId,
      type: TransactionType.PARTITION,
      amount: partition.price,
      partition_id: partition.id,
      status: TransactionStatus.PENDING,
    };
    const transaction = this.transactionRepository.create(transactionData);
    await this.transactionRepository.save(transaction);

    // 2. Appeler PayUnit
    const payunitResponse = await this.payunitService.initializePayment(
      partition.price,
      transaction.id.toString(),
      `Achat de la partition : ${partition.title}`,
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
      transaction.id.toString(),
      'Abonnement ClefCloud Premium',
    );

    return payunitResponse;
  }

  /**
   * Webhook appelé par PayUnit après le paiement
   */
  @Public()
  @Post('callback')
  async handleCallback(
    @Body() body: PayunitCallbackDto,
    @Headers('x-payunit-token') payunitToken: string,
  ) {
    // Vérification du token secret partagé avec PayUnit
    const expectedToken = this.configService.get<string>('PAYUNIT_WEBHOOK_SECRET');
    if (!expectedToken || !payunitToken || payunitToken !== expectedToken) {
      this.logger.warn(`Webhook PayUnit rejeté — token invalide ou manquant`);
      throw new UnauthorizedException('Token webhook invalide');
    }
    const { transaction_id, payunit_transaction_id, status } = body;

    const transaction = await this.transactionRepository.findOneBy({
      id: parseInt(transaction_id),
    });

    if (!transaction) {
      return { message: 'Transaction non trouvée' };
    }

    if (status === 'SUCCESS') {
      transaction.status = TransactionStatus.SUCCESS;
      transaction.payunit_transaction_id = payunit_transaction_id;
      await this.transactionRepository.save(transaction);

      // Si c'est un abonnement premium
      if (transaction.type === TransactionType.PREMIUM) {
        const user = await this.userRepository.findOneBy({ id: transaction.user_id });
        if (!user) {
          this.logger.error(`Utilisateur introuvable pour la transaction ${transaction.id}`);
          return { status: 'ok' };
        }
        user.is_premium = true;
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 30);
        user.premium_until = expiry;
        await this.userRepository.save(user);
      }

      // Si c'est l'achat d'une partition individuelle
      if (transaction.type === TransactionType.PARTITION && transaction.partition_id) {
        // Accorder l'accès permanent à cette partition
        const userPartition = this.transactionRepository.manager.create('UserPartition', {
          user_id: transaction.user_id,
          partition_id: transaction.partition_id,
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
