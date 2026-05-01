import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import * as dns from 'node:dns';
import { DataSource } from 'typeorm';
import helmet from 'helmet';
import { validateEnv } from './config/env.validation';

async function bootstrap() {
  // Valider les variables d'environnement avant tout démarrage
  validateEnv();

  // Force IPv4 for DNS resolution to avoid ENETUNREACH in Render Free Tier
  dns.setDefaultResultOrder('ipv4first');
  
  const app = await NestFactory.create(AppModule);
  // Tell express to trust the proxy (important for Render to get real client IPs)
  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  const logger = new Logger('Bootstrap');

  // Sécurité HTTP headers (helmet)
  app.use(helmet());

  // Fix: PostgreSQL ENUM Migration for 'expired' status
  const dataSource = app.get(DataSource);
  try {
    await dataSource.query("ALTER TYPE transactions_status_enum ADD VALUE IF NOT EXISTS 'expired'");
    logger.log('Database Enum migrations applied (transactions_status_enum).');
  } catch (error) {
    logger.warn(`Could not update transactions_status_enum : ${error.message}`);
  }

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS — restreint à l'origine configurée, jamais '*' en production
  const corsOrigin = process.env.CORS_ORIGIN;
  if (!corsOrigin || corsOrigin === '*') {
    logger.warn('⚠️  CORS_ORIGIN non défini ou trop permissif — restreindre en production !');
  }
  app.enableCors({
    origin: corsOrigin || 'http://localhost:5173',
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('ClefCloud API')
    .setDescription('API Backend pour ClefCloud - Gestion de partitions musicales')
    .setVersion('1.0')
    .addTag('auth', 'Authentification Firebase')
    .addTag('partitions', 'Gestion des partitions')
    .addTag('users', 'Gestion des utilisateurs')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');

  const url = `http://localhost:${port}`;
  logger.log(`🚀 Application is running on: ${url}/api`);
  logger.log(`📚 Swagger documentation: ${url}/api/docs`);
  logger.log(`🛠️ Environment: ${process.env.NODE_ENV}`);
}

bootstrap();
