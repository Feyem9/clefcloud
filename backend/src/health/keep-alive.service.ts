import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/**
 * Service qui maintient la connexion Supabase active.
 * Supabase (tier gratuit) met en pause les projets inactifs après 7 jours.
 * Ce cron job exécute une requête simple toutes les 12h pour éviter la mise en pause.
 */
@Injectable()
export class KeepAliveService {
  private readonly logger = new Logger(KeepAliveService.name);

  constructor(@InjectDataSource() private dataSource: DataSource) {}

  @Cron(CronExpression.EVERY_12_HOURS)
  async pingDatabase() {
    try {
      await this.dataSource.query('SELECT 1');
      this.logger.log('✅ Keep-alive ping Supabase — connexion active');
    } catch (error) {
      this.logger.error(`❌ Keep-alive ping échoué : ${error.message}`);
    }
  }
}
