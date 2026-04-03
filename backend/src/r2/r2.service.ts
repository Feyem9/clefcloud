import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class R2Service {
  private readonly logger = new Logger(R2Service.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly publicUrl: string;

  constructor(private readonly configService: ConfigService) {
    const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('R2_SECRET_ACCESS_KEY');
    const endpoint = this.configService.get<string>('R2_ENDPOINT');
    this.bucketName = this.configService.get<string>('R2_BUCKET_NAME');
    this.publicUrl = this.configService.get<string>('R2_PUBLIC_URL');

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: endpoint,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
    });
  }

  /**
   * Upload d'un fichier sur Cloudflare R2
   */
  async uploadFile(
    userId: number,
    file: Express.Multer.File,
    cleanPath: string,
  ): Promise<{ storagePath: string; downloadUrl: string }> {
    try {
      const parallelUploads3 = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.bucketName,
          Key: cleanPath,
          Body: file.buffer,
          ContentType: file.mimetype,
          Metadata: {
            uploadedBy: String(userId),
          },
        },
      });

      await parallelUploads3.done();

      // Construction de l'URL publique
      const downloadUrl = `${this.publicUrl}/${cleanPath}`;

      this.logger.log(`Fichier uploadé sur R2 : ${cleanPath}`);

      return { storagePath: cleanPath, downloadUrl };
    } catch (error) {
      this.logger.error(`Erreur d'upload R2: ${error.message}`);
      throw error;
    }
  }

  /**
   * Suppression d'un fichier sur Cloudflare R2
   */
  async deleteFile(storagePath: string): Promise<void> {
    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: storagePath,
        }),
      );
      this.logger.log(`Fichier supprimé sur R2 : ${storagePath}`);
    } catch (error) {
      this.logger.error(`Erreur suppression R2: ${error.message}`);
    }
  }

  /**
   * Génère une URL signée temporaire (Presigned URL)
   */
  async getPresignedUrl(storagePath: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: storagePath,
    });
    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Récupère un fichier depuis R2
   */
  async getFile(key: string) {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    return this.s3Client.send(command);
  }
}
