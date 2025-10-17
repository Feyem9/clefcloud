import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VerificationCode } from './entities/verification-code.entity';
import { VerificationService } from './verification.service';
import { VerificationController } from './verification.controller';
import { RabbitMQConsumer } from './rabbitmq.consumer';
import { EmailService } from './email.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([VerificationCode]),
  ],
  controllers: [VerificationController],
  providers: [
    VerificationService,
    RabbitMQConsumer,
    EmailService,
  ],
  exports: [VerificationService],
})
export class VerificationModule {}
