import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { MailService } from '../mail.service';

@Injectable()
export class AuthRabbitMQConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AuthRabbitMQConsumer.name);
  private connection: any;
  private channel: any;
  private readonly queueName = 'auth-verification-codes';

  constructor(
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async onModuleInit() {
    const rabbitmqUrl = this.configService.get<string>('RABBITMQ_URL');

    if (!rabbitmqUrl) {
      this.logger.warn('⚠️  RABBITMQ_URL not configured, consumer disabled');
      return;
    }

    try {
      await this.connect(rabbitmqUrl);
    } catch (error) {
      this.logger.error('❌ Failed to connect to RabbitMQ:', error);
    }
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect(url: string) {
    this.logger.log(`🐰 Connexion à RabbitMQ: ${url.replace(/\/\/.*@/, '//***@')}`);

    this.connection = await amqp.connect(url);
    this.channel = await this.connection.createChannel();

    // Créer la queue si elle n'existe pas
    await this.channel.assertQueue(this.queueName, { durable: true });

    // Limiter à 1 message à la fois pour éviter la surcharge
    await this.channel.prefetch(1);

    this.logger.log(`✅ Connecté à RabbitMQ - Queue: ${this.queueName}`);
    this.logger.log(`👂 Écoute de la queue: ${this.queueName}`);

    // Consommer les messages
    await this.channel.consume(
      this.queueName,
      async (msg: any) => {
        if (msg) {
          await this.handleMessage(msg);
        }
      },
      { noAck: false } // Acknowledgement manuel
    );
  }

  private async handleMessage(msg: any) {
    try {
      const content = msg.content.toString();
      const data = JSON.parse(content);

      this.logger.log(`📨 Message reçu: ${data.email}`);

      // Envoyer l'email
      await this.mailService.sendVerificationEmail(data.email, data.code);

      // Acknowledger le message (succès)
      this.channel.ack(msg);
      this.logger.log(`✅ Message traité avec succès: ${data.email}`);

    } catch (error) {
      this.logger.error('❌ Erreur lors du traitement du message:', error);

      // Rejeter le message et le remettre dans la queue
      this.channel.nack(msg, false, true);
    }
  }

  private async disconnect() {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      this.logger.log('🔌 Déconnecté de RabbitMQ');
    } catch (error) {
      this.logger.error('❌ Erreur lors de la déconnexion:', error);
    }
  }
}
