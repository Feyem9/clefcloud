import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { PartitionsModule } from './partitions/partitions.module';
import { UsersModule } from './users/users.module';
import { FirebaseModule } from './firebase/firebase.module';
import { MailModule } from './mail.module';
import { HealthModule } from './health/health.module';
import { FirebaseAuthGuard } from './auth/guards/firebase-auth.guard';
import { PayunitModule } from './payunit/payunit.module';

@Module({
  imports: [
    // Configuration globale
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate limiting global : 20 requêtes par minute par IP
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 20,
      },
    ]),

    // Base de données (Supabase / Postgres)
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const host = config.get<string>('DB_HOST');
        const logger = new Logger('TypeOrmConfig');
        const isProduction = config.get<string>('NODE_ENV') === 'production';
        const synchronize = !isProduction;

        logger.log(`Connecting to database at ${host}`);
        if (isProduction) {
          logger.log('🔒 TypeORM synchronize DISABLED (production mode)');
        } else {
          logger.warn('⚠️  TypeORM synchronize ENABLED — development mode only');
        }

        return {
          type: 'postgres',
          host,
          port: config.get<number>('DB_PORT'),
          username: config.get<string>('DB_USERNAME'),
          password: config.get<string>('DB_PASSWORD'),
          database: config.get<string>('DB_DATABASE'),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize,
          ssl: config.get<string>('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,
          extra: {
            family: 4, // Force IPv4 to avoid ENETUNREACH on Render Free Tier
          },
        };
      },
    }),

    // Modules fonctionnels
    FirebaseModule,
    AuthModule,
    PartitionsModule,
    UsersModule,
    PayunitModule,
    MailModule,
    HealthModule,
  ],
  providers: [
    // Guard Firebase global sur toutes les routes
    {
      provide: APP_GUARD,
      useClass: FirebaseAuthGuard,
    },
    // Rate limiting global
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
