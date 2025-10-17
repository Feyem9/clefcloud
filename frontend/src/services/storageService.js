// Service de stockage abstrait - Supporte AWS S3 et Supabase
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, AWS_CONFIG, isAWSConfigured } from '../aws/config';
import { supabase } from '../supabase/config';

// Stratégie de stockage par défaut (peut être changée dynamiquement)
const STORAGE_STRATEGY = import.meta.env.VITE_STORAGE_STRATEGY || 'supabase'; // 'aws' ou 'supabase'

/**
 * Service de stockage AWS S3
 */
class AWSStorageService {
  async uploadFile(file, path, options = {}) {
    try {
      const command = new PutObjectCommand({
        Bucket: AWS_CONFIG.s3.bucketName,
        Key: path,
        Body: file,
        ContentType: file.type,
        ...options
      });

      await s3Client.send(command);

      // Générer l'URL publique
      const url = `https://${AWS_CONFIG.s3.bucketName}.s3.${AWS_CONFIG.s3.region}.amazonaws.com/${path}`;
      
      return {
        success: true,
        url,
        path,
        provider: 'aws'
      };
    } catch (error) {
      console.error('AWS S3 Upload Error:', error);
      throw new Error(`Erreur lors de l'upload vers AWS S3: ${error.message}`);
    }
  }

  async getSignedUrl(path, expiresIn = 3600) {
    try {
      const command = new GetObjectCommand({
        Bucket: AWS_CONFIG.s3.bucketName,
        Key: path,
      });

      const url = await getSignedUrl(s3Client, command, { expiresIn });
      return url;
    } catch (error) {
      console.error('AWS S3 Signed URL Error:', error);
      throw new Error(`Erreur lors de la génération de l'URL signée: ${error.message}`);
    }
  }

  async deleteFile(path) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: AWS_CONFIG.s3.bucketName,
        Key: path,
      });

      await s3Client.send(command);
      return { success: true, provider: 'aws' };
    } catch (error) {
      console.error('AWS S3 Delete Error:', error);
      throw new Error(`Erreur lors de la suppression du fichier: ${error.message}`);
    }
  }

  getPublicUrl(path) {
    return `https://${AWS_CONFIG.s3.bucketName}.s3.${AWS_CONFIG.s3.region}.amazonaws.com/${path}`;
  }
}

/**
 * Service de stockage Supabase
 */
class SupabaseStorageService {
  async uploadFile(file, path, options = {}) {
    try {
      const { data, error } = await supabase.storage
        .from('Partitions')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
          ...options
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('Partitions')
        .getPublicUrl(path);

      return {
        success: true,
        url: publicUrl,
        path,
        provider: 'supabase'
      };
    } catch (error) {
      console.error('Supabase Upload Error:', error);
      throw new Error(`Erreur lors de l'upload vers Supabase: ${error.message}`);
    }
  }

  async getSignedUrl(path, expiresIn = 3600) {
    try {
      const { data, error } = await supabase.storage
        .from('Partitions')
        .createSignedUrl(path, expiresIn);

      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      console.error('Supabase Signed URL Error:', error);
      throw new Error(`Erreur lors de la génération de l'URL signée: ${error.message}`);
    }
  }

  async deleteFile(path) {
    try {
      const { error } = await supabase.storage
        .from('Partitions')
        .remove([path]);

      if (error) throw error;
      return { success: true, provider: 'supabase' };
    } catch (error) {
      console.error('Supabase Delete Error:', error);
      throw new Error(`Erreur lors de la suppression du fichier: ${error.message}`);
    }
  }

  getPublicUrl(path) {
    const { data: { publicUrl } } = supabase.storage
      .from('Partitions')
      .getPublicUrl(path);
    return publicUrl;
  }
}

/**
 * Factory pour créer le service de stockage approprié
 */
class StorageServiceFactory {
  static getService(strategy = STORAGE_STRATEGY) {
    if (strategy === 'aws' && isAWSConfigured()) {
      console.log('📦 Utilisation du stockage AWS S3');
      return new AWSStorageService();
    } else {
      console.log('📦 Utilisation du stockage Supabase');
      return new SupabaseStorageService();
    }
  }
}

// Export du service de stockage
export const storageService = StorageServiceFactory.getService();

// Export pour permettre le changement de stratégie
export { StorageServiceFactory, AWSStorageService, SupabaseStorageService };
