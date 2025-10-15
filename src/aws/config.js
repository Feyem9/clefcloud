// Configuration AWS
import { S3Client } from '@aws-sdk/client-s3';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';

// Configuration AWS depuis les variables d'environnement
const awsConfig = {
  region: import.meta.env.VITE_AWS_REGION || 'eu-west-1',
  credentials: {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
  }
};

// Client S3 pour le stockage
export const s3Client = new S3Client(awsConfig);

// Client Cognito pour l'authentification
export const cognitoClient = new CognitoIdentityProviderClient(awsConfig);

// Configuration des buckets et ressources
export const AWS_CONFIG = {
  s3: {
    bucketName: import.meta.env.VITE_AWS_S3_BUCKET_NAME || 'clefcloud-partitions',
    region: import.meta.env.VITE_AWS_REGION || 'eu-west-1',
  },
  cognito: {
    userPoolId: import.meta.env.VITE_AWS_COGNITO_USER_POOL_ID,
    clientId: import.meta.env.VITE_AWS_COGNITO_CLIENT_ID,
    region: import.meta.env.VITE_AWS_REGION || 'eu-west-1',
  },
  ec2: {
    apiEndpoint: import.meta.env.VITE_AWS_API_ENDPOINT || 'http://localhost:3000',
  },
  rds: {
    endpoint: import.meta.env.VITE_AWS_RDS_ENDPOINT,
    database: import.meta.env.VITE_AWS_RDS_DATABASE || 'clefcloud',
  }
};

// Vérification de la configuration
export const isAWSConfigured = () => {
  return !!(
    awsConfig.credentials.accessKeyId &&
    awsConfig.credentials.secretAccessKey &&
    AWS_CONFIG.s3.bucketName
  );
};

export default awsConfig;
