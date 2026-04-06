import { Module, Logger } from '@nestjs/common';
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
import { PayunitModule } from './payunit/payunit.module';
import { R2Module } from './r2/r2.module';
import { TestimonialsModule } from './testimonials/testimonials.module';
import { ContentModule } from './content/content.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    // Configuration globale
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // Planification des tâches (CRON)
    ScheduleModule.forRoot(),

    // Base de données (Supabase / Postgres)
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const host = config.get<string>('DB_HOST');
        const logger = new Logger('TypeOrmConfig');
        logger.log(`Connecting to database at ${host}`);
        return {
          type: 'postgres',
          host,
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: config.get<string>('NODE_ENV') === 'development', // SÉCURITÉ : False en production
        ssl: config.get<string>('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,
        extra: {
          family: 4, // Force IPv4 to avoid ENETUNREACH on Render Free Tier
        },
      };
    },
  }),

    // Modules fonctionnels
    FirebaseModule,
    R2Module,
    AuthModule,
    PartitionsModule,
    UsersModule,
    PayunitModule,
    MailModule,
    HealthModule,
    TestimonialsModule,
    ContentModule,
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
