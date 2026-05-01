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
      if (admin.apps.length === 0) {
        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
          storageBucket,
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
   * Upload d'un fichier (Partition ou Audio).
   * Retourne uniquement le storagePath — ne pas stocker download_url en base.
   * Les URLs d'accès sont générées à la demande via getSignedUrl().
   */
  async uploadFile(
    userId: number,
    file: Express.Multer.File,
    cleanPath: string,
  ): Promise<{ storagePath: string }> {
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

    this.logger.log(`Fichier uploadé : ${cleanPath}`);
    return { storagePath: cleanPath };
  }

  /**
   * Upload d'un fichier public (cover image).
   * Le fichier est rendu public et son URL est permanente — c'est intentionnel
   * car c'est une image de prévisualisation, pas un fichier protégé.
   */
  async uploadPublicFile(
    userId: number,
    file: Express.Multer.File,
    cleanPath: string,
  ): Promise<string> {
    const bucket = this.storage;
    const fileRef = bucket.file(cleanPath);

    await fileRef.save(file.buffer, {
      contentType: file.mimetype,
      metadata: { metadata: { uploadedBy: String(userId) } },
    });

    await fileRef.makePublic();

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${cleanPath}`;
    this.logger.log(`Fichier public uploadé : ${cleanPath}`);
    return publicUrl;
  }

  /**
   * Génère une URL signée temporaire pour accéder à un fichier protégé.
   * L'URL expire après le délai spécifié (défaut : 15 minutes).
   * Ne jamais stocker cette URL en base — la générer à chaque demande.
   */
  async getSignedUrl(storagePath: string, expiresInMs = 15 * 60 * 1000): Promise<string> {
    const [signedUrl] = await this.storage.file(storagePath).getSignedUrl({
      action: 'read',
      expires: Date.now() + expiresInMs,
    });
    this.logger.log(
      `URL signée générée pour : ${storagePath} (expire dans ${expiresInMs / 60000} min)`,
    );
    return signedUrl;
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
