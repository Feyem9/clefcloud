import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { MailService } from '../mail.service';
import { HealthStatus, DatabaseStatus } from '../common/enums/health.enum';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
    private mailService: MailService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'Service is unhealthy' })
  async check() {
    const health = {
      uptime: process.uptime(),
      timestamp: Date.now(),
      status: HealthStatus.OK,
      services: {
        database: DatabaseStatus.UNKNOWN,
      },
    };

    try {
      // Check database connection
      await this.dataSource.query('SELECT 1');
      health.services.database = DatabaseStatus.CONNECTED;
    } catch (error) {
      health.services.database = DatabaseStatus.DISCONNECTED;
      health.status = HealthStatus.DEGRADED;
    }

    const statusCode = health.status === HealthStatus.OK ? 200 : 503;

    return {
      statusCode,
      ...health,
    };
  }

  @Public()
  @Get('test-email')
  @ApiOperation({ summary: 'Send a test email' })
  async testEmail() {
    // Remplacez par une vraie adresse pour un test en production,
    // ou n'importe quoi pour maildev
    await this.mailService.sendTestEmail('test@example.com');
    return { message: 'Test email sent. Check MailDev UI.' };
  }
}
