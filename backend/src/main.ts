import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import * as dns from 'node:dns';
import { DataSource } from 'typeorm';

async function bootstrap() {
  // Force IPv4 for DNS resolution to avoid ENETUNREACH in Render Free Tier
  dns.setDefaultResultOrder('ipv4first');
  
  const app = await NestFactory.create(AppModule);
  // Tell express to trust the proxy (important for Render to get real client IPs)
  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  const logger = new Logger('Bootstrap');

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
    .setDescription('API Backend pour ClefCloud - Gestion de partitions musicales')
    .setVersion('1.0')
    .addTag('auth', 'Authentification avec AWS Cognito')
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
