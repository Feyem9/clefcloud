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
    const storageBucket = this.configService.get<string>('FIREBASE_STORAGE_BUCKET');

    if (!projectId || !clientEmail || !privateKey) {
      this.logger.error('❌ Configuration Firebase incomplète dans le .env !');
      return;
    }

    try {
      this.firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        storageBucket,
      });
      this.logger.log(`✅ Firebase Admin initialisé pour le projet : ${projectId}`);
    } catch (error) {
      this.logger.error(`❌ Erreur d'initialisation Firebase : ${error.message}`);
    }
  }

  get auth() {
    return admin.auth(this.firebaseApp);
  }

  get storage() {
    return admin.storage(this.firebaseApp).bucket();
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

  /**
   * Upload d'un fichier (Partition ou Audio)
   */
  async uploadFile(
    userId: number,
    file: Express.Multer.File,
    cleanPath: string,
  ): Promise<{ storagePath: string; downloadUrl: string }> {
    const bucket = this.storage;
    const fileRef = bucket.file(cleanPath);

    await fileRef.save(file.buffer, {
      contentType: file.mimetype,
      metadata: {
        metadata: {
          uploadedBy: String(userId),
        },
      },
    });

    // Rendre le fichier public (standard pour ClefCloud)
    await fileRef.makePublic();
    const downloadUrl = fileRef.publicUrl();

    this.logger.log(`Fichier uploadé : ${cleanPath}`);

    return { storagePath: cleanPath, downloadUrl };
  }

  /**
   * Suppression d'un fichier
   */
  async deleteFile(storagePath: string): Promise<void> {
    try {
      await this.storage.file(storagePath).delete();
      this.logger.log(`Fichier supprimé : ${storagePath}`);
    } catch (error) {
      this.logger.error(`Erreur suppression fichier ${storagePath}: ${error.message}`);
    }
  }
}
