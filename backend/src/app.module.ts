import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { PartitionsModule } from './partitions/partitions.module';
import { UsersModule } from './users/users.module';
import { AwsModule } from './aws/aws.module';
import { HealthModule } from './health/health.module';
import { MailModule } from './mail.module';
import { VerificationModule } from './verification/verification.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // TypeORM - PostgreSQL
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.RDS_ENDPOINT?.split(':')[0],
      port: parseInt(process.env.RDS_ENDPOINT?.split(':')[1] || '5432'),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'clefcloud',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
      ssl: {
        rejectUnauthorized: false,
      },
      logging: process.env.NODE_ENV === 'development',
      extra: {
        max: 10,
        connectionTimeoutMillis: 5000,
      },
    }),

    // Feature modules
    AwsModule,
    AuthModule,
    PartitionsModule,
    UsersModule,
    HealthModule,
    MailModule,
    VerificationModule,
  ],
})
export class AppModule {}
