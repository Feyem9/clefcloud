import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { VerificationService } from './verification.service';

@Injectable()
export class RabbitMQConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQConsumer.name);
  private connection: any;
  private channel: any;
  private readonly queueName = 'cognito-verification-codes';

  constructor(
    private readonly configService: ConfigService,
    private readonly verificationService: VerificationService,
  ) {}

  async onModuleInit() {
    await this.connect();
    await this.startConsuming();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  /**
   * Connexion à RabbitMQ
   * 
   * 
   * 
   */
  private async connect() {
    try {
      const url = this.configService.get<string>('RABBITMQ_URL') || 'amqp://localhost:5672';
      
      this.logger.log(`🐰 Connexion à RabbitMQ: ${url}`);
      
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();

      // Configurer la queue
      await this.channel.assertQueue(this.queueName, {
        durable: true,
        arguments: {
          'x-message-ttl': 3600000, // 1 heure
          'x-max-length': 10000,
        },
      });

      // Limiter le nombre de messages traités en parallèle
      await this.channel.prefetch(10);

      this.logger.log(`✅ Connecté à RabbitMQ - Queue: ${this.queueName}`);

      // Gérer les erreurs de connexion
      this.connection.on('error', (err) => {
        this.logger.error('❌ Erreur de connexion RabbitMQ:', err);
      });

      this.connection.on('close', () => {
        this.logger.warn('⚠️  Connexion RabbitMQ fermée - Reconnexion dans 5s...');
        setTimeout(() => this.connect(), 5000);
      });

    } catch (error) {
      this.logger.error('❌ Impossible de se connecter à RabbitMQ:', error);
      // Réessayer dans 5 secondes
      setTimeout(() => this.connect(), 5000);
    }
  }

  /**
   * Démarrer la consommation des messages
   */
  private async startConsuming() {
    try {
      this.logger.log(`👂 Écoute de la queue: ${this.queueName}`);

      await this.channel.consume(
        this.queueName,
        async (msg) => {
          if (!msg) return;

          try {
            const content = msg.content.toString();
            const data = JSON.parse(content);

            this.logger.log(`📨 Message reçu - Email: ${data.email}, Type: ${data.eventType}`);

            // Traiter le message
            await this.processMessage(data);

            // Acquitter le message
            this.channel.ack(msg);
            this.logger.log(`✅ Message traité et acquitté`);

          } catch (error) {
            this.logger.error('❌ Erreur lors du traitement du message:', error);

            // Rejeter le message et le remettre dans la queue
            // (max 3 tentatives via x-delivery-count)
            const deliveryCount = msg.properties.headers['x-delivery-count'] || 0;
            
            if (deliveryCount < 3) {
              this.channel.nack(msg, false, true); // Remettre dans la queue
              this.logger.warn(`⚠️  Message remis dans la queue (tentative ${deliveryCount + 1}/3)`);
            } else {
              this.channel.nack(msg, false, false); // Rejeter définitivement
              this.logger.error(`❌ Message rejeté après 3 tentatives`);
            }
          }
        },
        { noAck: false }, // Acquittement manuel
      );

    } catch (error) {
      this.logger.error('❌ Erreur lors du démarrage de la consommation:', error);
    }
  }

  /**
   * Traiter un message de vérification
   */
  private async processMessage(data: any) {
    const {
      userId,
      userPoolId,
      email,
      phoneNumber,
      verificationCode,
      verificationLink,
      triggerSource,
      eventType,
      timestamp,
      lambdaRequestId,
      userAttributes,
    } = data;

    // Sauvegarder dans PostgreSQL et envoyer l'email
    await this.verificationService.processVerificationCode({
      userId,
      userPoolId,
      email,
      phoneNumber,
      verificationCode,
      verificationLink,
      triggerSource,
      eventType,
      lambdaRequestId,
      userAttributes,
      receivedAt: new Date(timestamp),
    });
  }

  /**
   * Déconnexion propre
   */
  private async disconnect() {
    try {
      if (this.channel) {
        await this.channel.close();
        this.logger.log('✅ Canal RabbitMQ fermé');
      }

      if (this.connection) {
        await this.connection.close();
        this.logger.log('✅ Connexion RabbitMQ fermée');
      }
    } catch (error) {
      this.logger.error('❌ Erreur lors de la déconnexion:', error);
    }
  }
}
