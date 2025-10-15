import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { MailService } from './mail.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    @InjectConnection() private connection: Connection,
    private mailService: MailService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'Service is unhealthy' })
  async check() {
    const health = {
      uptime: process.uptime(),
      timestamp: Date.now(),
      status: 'OK',
      services: {
        database: 'unknown',
      },
    };

    try {
      // Check database connection
      await this.connection.query('SELECT 1');
      health.services.database = 'connected';
    } catch (error) {
      health.services.database = 'disconnected';
      health.status = 'DEGRADED';
    }

    const statusCode = health.status === 'OK' ? 200 : 503;

    return {
      statusCode,
      ...health,
    };
  }

  @Get('test-email')
  @ApiOperation({ summary: 'Send a test email' })
  async testEmail() {
    // Remplacez par une vraie adresse pour un test en production,
    // ou n'importe quoi pour maildev
    await this.mailService.sendTestEmail('test@example.com');
    return { message: 'Test email sent. Check MailDev UI.' };
  }
}
