import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { initializeApp, cert, App as FirebaseApp } from 'firebase-admin/app';
import { getStorage, Storage } from 'firebase-admin/storage';

@Injectable()
export class FirebaseService {
  private readonly logger = new Logger(FirebaseService.name);
  private app: FirebaseApp;
  private storage: Storage['bucket'];

  constructor(private readonly configService: ConfigService) {
    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.configService
      .get<string>('FIREBASE_PRIVATE_KEY')
      ?.replace(/\\n/g, '\n');
    const storageBucket = this.configService.get<string>('FIREBASE_STORAGE_BUCKET');

    if (!projectId || !clientEmail || !privateKey || !storageBucket) {
      this.logger.warn('Firebase configuration is incomplete. FirebaseService will be disabled.');
      return;
    }

    this.app = initializeApp(
      {
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        storageBucket,
      },
      'clefcloud-backend-app',
    );

    this.storage = getStorage(this.app).bucket();
    this.logger.log(`Firebase initialized with project ${projectId} and bucket ${storageBucket}`);
  }

  get isEnabled(): boolean {
    return !!this.app && !!this.storage;
  }

  async uploadPartitionFile(
    userId: number,
    file: Express.Multer.File,
    cleanTitle: string,
  ): Promise<{ storagePath: string; downloadUrl: string }> {
    if (!this.isEnabled) {
      throw new Error('Firebase is not configured correctly');
    }

    const timestamp = Date.now();
    const fileExtension = file.originalname.split('.').pop();
    const safeTitle = cleanTitle || 'partition';
    const fileName = `${timestamp}_${safeTitle}.${fileExtension}`;
    const storagePath = `partitions/${userId}/${fileName}`;

    const fileRef = this.storage.file(storagePath);

    await fileRef.save(file.buffer, {
      contentType: file.mimetype,
      metadata: {
        metadata: {
          uploadedBy: String(userId),
          title: safeTitle,
        },
      },
    });

    // Rendre le fichier publiquement lisible (simple pour commencer)
    await fileRef.makePublic();
    const downloadUrl = fileRef.publicUrl();

    this.logger.log(`File uploaded to Firebase Storage: ${storagePath}`);

    return { storagePath, downloadUrl };
  }

  async deleteFile(storagePath: string): Promise<void> {
    if (!this.isEnabled) {
      this.logger.warn('Firebase is not enabled, skip deleteFile');
      return;
    }

    try {
      const fileRef = this.storage.file(storagePath);
      await fileRef.delete();
      this.logger.log(`File deleted from Firebase Storage: ${storagePath}`);
    } catch (error) {
      this.logger.error(`Failed to delete Firebase file ${storagePath}: ${error.message}`);
      // On ne propage pas forcément l'erreur pour ne pas casser la suppression côté API
    }
  }
}
