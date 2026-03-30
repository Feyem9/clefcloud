import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private firebaseApp: admin.app.App;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.configService
      .get<string>('FIREBASE_PRIVATE_KEY')
      ?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      this.logger.error('❌ Configuration Firebase incomplète dans le .env !');
      return;
    }

    try {
      if (admin.apps.length === 0) {
        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
        this.logger.log(`✅ Firebase Admin initialisé pour le projet : ${projectId}`);
      } else {
        this.firebaseApp = admin.app();
        this.logger.log('✅ Firebase Admin déjà initialisé (réutilisation)');
      }
    } catch (error) {
      this.logger.error(`❌ Erreur d'initialisation Firebase : ${error.message}`);
    }
  }

  get auth() {
    return admin.auth(this.firebaseApp);
  }

  /**
   * Vérifie un token ID Firebase envoyé par le frontend
   */
  async verifyIdToken(token: string) {
    try {
      return await this.auth.verifyIdToken(token);
    } catch (error) {
      this.logger.error(`Token verification failed: ${error.message}`);
      throw error;
    }
  }
}
