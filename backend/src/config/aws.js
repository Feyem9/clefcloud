import { S3Client } from '@aws-sdk/client-s3';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';

// Configuration AWS
const awsConfig = {
  region: process.env.AWS_REGION || 'eu-west-1',
  credentials: process.env.AWS_ACCESS_KEY_ID ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  } : undefined // Utilise IAM role si pas de credentials explicites
};

// Clients AWS
export const s3Client = new S3Client(awsConfig);
export const cognitoClient = new CognitoIdentityProviderClient(awsConfig);

// Configuration
export const AWS_CONFIG = {
  s3: {
    bucketName: process.env.S3_BUCKET || 'clefcloud-partitions-dev',
    region: awsConfig.region,
  },
  cognito: {
    userPoolId: process.env.COGNITO_USER_POOL_ID,
    clientId: process.env.COGNITO_CLIENT_ID,
  },
  rds: {
    host: process.env.RDS_ENDPOINT?.split(':')[0],
    port: parseInt(process.env.RDS_ENDPOINT?.split(':')[1] || '5432'),
    database: process.env.DB_NAME || 'clefcloud',
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
  }
};

export default awsConfig;
