import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { MailModule } from '../mail.module';
import { KeepAliveService } from './keep-alive.service';

@Module({
  imports: [MailModule],
  controllers: [HealthController],
  providers: [KeepAliveService],
})
export class HealthModule {}
