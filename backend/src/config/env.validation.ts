import { Logger } from '@nestjs/common';

const logger = new Logger('EnvValidation');

const REQUIRED_VARS: string[] = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'DB_HOST',
  'DB_PORT',
  'DB_USERNAME',
  'DB_PASSWORD',
  'DB_DATABASE',
  'MAIL_USER',
  'MAIL_PASSWORD',
  'MAIL_FROM_EMAIL',
];

export function validateEnv(): void {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    logger.error(`❌ Variables d'environnement manquantes : ${missing.join(', ')}`);
    logger.error('Arrêt du serveur — configurez ces variables avant de démarrer.');
    process.exit(1);
  }

  logger.log("✅ Variables d'environnement validées");
}
