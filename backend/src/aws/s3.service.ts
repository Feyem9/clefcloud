import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;

  constructor(private configService: ConfigService) {
    this.region = this.configService.get('AWS_REGION', 'eu-west-1');
    this.bucketName = this.configService.get('S3_BUCKET', 'clefcloud-partitions-dev');

    const credentials = this.configService.get('AWS_ACCESS_KEY_ID')
      ? {
          accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
          secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
        }
      : undefined;

    this.s3Client = new S3Client({
      region: this.region,
      credentials,
    });

    this.logger.log(`S3 Service initialized - Bucket: ${this.bucketName}, Region: ${this.region}`);
  }

  /**
   * Upload un fichier vers S3
   */
  async uploadFile(
    file: Express.Multer.File,
    path: string,
    metadata?: Record<string, string>,
  ): Promise<{ url: string; path: string }> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: path,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: metadata,
      });

      await this.s3Client.send(command);

      const url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${path}`;

      this.logger.log(`File uploaded successfully: ${path}`);

      return { url, path };
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Génère une URL signée pour téléchargement
   */
  async getSignedUrl(path: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: path,
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });
      return url;
    } catch (error) {
      this.logger.error(`Failed to generate signed URL: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Supprime un fichier de S3
   */
  async deleteFile(path: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: path,
      });

      await this.s3Client.send(command);
      this.logger.log(`File deleted successfully: ${path}`);
    } catch (error) {
      this.logger.error(`Failed to delete file: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Vérifie si un fichier existe
   */
  async fileExists(path: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: path,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      if (error.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Obtient l'URL publique d'un fichier
   */
  getPublicUrl(path: string): string {
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${path}`;
  }
}
