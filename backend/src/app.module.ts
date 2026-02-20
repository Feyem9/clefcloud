import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { PartitionsModule } from './partitions/partitions.module';
import { UsersModule } from './users/users.module';
import { FirebaseModule } from './firebase/firebase.module';
import { MailModule } from './mail.module';
import { HealthModule } from './health/health.module';
import { APP_GUARD } from '@nestjs/core';
import { FirebaseAuthGuard } from './auth/guards/firebase-auth.guard';

@Module({
  imports: [
    // Configuration globale
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Base de données (Supabase / Postgres)
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: config.get<string>('NODE_ENV') === 'development', // SÉCURITÉ : False en production
        ssl: config.get<string>('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,
      }),
    }),

    // Modules fonctionnels
    FirebaseModule,
    AuthModule,
    PartitionsModule,
    UsersModule,
    MailModule,
    HealthModule,
  ],
  providers: [
    // On applique le Guard Firebase globalement sur TOUTES les routes
    // Les routes publiques devront utiliser le décorateur @Public()
    {
      provide: APP_GUARD,
      useClass: FirebaseAuthGuard,
    },
  ],
})
export class AppModule {}
