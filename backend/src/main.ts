import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import * as dns from 'node:dns';
import helmet from 'helmet';
import { validateEnv } from './config/env.validation';

async function bootstrap() {
  // Force IPv4 for DNS resolution to avoid ENETUNREACH in Render Free Tier
  dns.setDefaultResultOrder('ipv4first');

  // Vérification des variables d'env critiques avant tout démarrage
  validateEnv();

  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Security headers
  app.use(helmet());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('ClefCloud API')
    .setDescription('API Backend pour ClefCloud - Plateforme de partitions musicales')
    .setVersion('1.0')
    .addTag('auth', 'Authentification Firebase')
    .addTag('partitions', 'Gestion des partitions')
    .addTag('users', 'Gestion des utilisateurs')
    .addTag('payments', 'Paiements via PayUnit')
    .addTag('health', 'Santé du service')
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
