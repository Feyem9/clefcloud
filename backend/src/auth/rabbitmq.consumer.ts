import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Connection, Channel, ConsumeMessage, connect } from 'amqplib';
import { MailService } from '../mail.service';

@Injectable()
export class AuthRabbitMQConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AuthRabbitMQConsumer.name);
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private readonly queueName = 'auth-verification-codes';

  constructor(
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async onModuleInit() {
    const rabbitmqUrl = this.configService.get<string>('RABBITMQ_URL');

    if (!rabbitmqUrl) {
      this.logger.warn('⚠️  RABBITMQ_URL non configuré, consommateur désactivé');
      return;
    }

    try {
      await this.connect(rabbitmqUrl);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`❌ Échec de la connexion à RabbitMQ : ${errorMessage}`);
    }
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect(url: string) {
    this.logger.log(`🐰 Connexion à RabbitMQ: ${url.replace(/\/\/.*@/, '//***@')}`);

    this.connection = await connect(url) as unknown as Connection;
    // On utilise un cast vers 'unknown' puis vers le type désiré pour éviter 'any' direct
    // si le compilateur râle sur la compatibilité structurelle.
    this.channel = await (this.connection as unknown as { createChannel(): Promise<Channel> }).createChannel();

    // Créer la queue si elle n'existe pas
    await this.channel.assertQueue(this.queueName, { durable: true });

    // Limiter à 1 message à la fois pour éviter la surcharge
    await this.channel.prefetch(1);

    this.logger.log(`✅ Connecté à RabbitMQ - Queue: ${this.queueName}`);
    this.logger.log(`👂 Écoute de la queue: ${this.queueName}`);

    // Consommer les messages
    await this.channel.consume(
      this.queueName,
      async (msg: ConsumeMessage | null) => {
        if (msg) {
          await this.handleMessage(msg);
        }
      },
      { noAck: false } // Acknowledgement manuel
    );
  }

  private async handleMessage(msg: ConsumeMessage) {
    try {
      const content = msg.content.toString();
      const data = JSON.parse(content) as { email: string; code: string };

      this.logger.log(`📨 Message reçu : ${data.email}`);

      // Envoyer l'email
      await this.mailService.sendVerificationEmail(data.email, data.code);

      // Acknowledger le message (succès)
      if (this.channel) {
        this.channel.ack(msg);
      }
      this.logger.log(`✅ Message traité avec succès : ${data.email}`);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`❌ Erreur lors du traitement du message : ${errorMessage}`);

      // Rejeter le message et le remettre dans la queue
      if (this.channel) {
        this.channel.nack(msg, false, true);
      }
    }
  }

  private async disconnect() {
    try {
      if (this.channel) {
        await (this.channel as unknown as { close(): Promise<void> }).close();
      }
      if (this.connection) {
        await (this.connection as unknown as { close(): Promise<void> }).close();
      }
      this.logger.log('🔌 Déconnecté de RabbitMQ');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`❌ Erreur lors de la déconnexion : ${errorMessage}`);
    }
  }
}
