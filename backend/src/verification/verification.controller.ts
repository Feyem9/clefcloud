import { Controller, Get, Post, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { VerificationService } from './verification.service';
import { VerificationStatus, VerificationEventType } from './entities/verification-code.entity';
import { CognitoJwtAuthGuard } from '../auth/guards/cognito-jwt-auth.guard';

@ApiTags('verification')
@Controller('verification')
@UseGuards(CognitoJwtAuthGuard)
@ApiBearerAuth()
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Get()
  @ApiOperation({ summary: 'Liste tous les codes de vérification (Admin)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: VerificationStatus })
  @ApiQuery({ name: 'eventType', required: false, enum: VerificationEventType })
  @ApiQuery({ name: 'email', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Liste des codes' })
  async findAll(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('status') status?: VerificationStatus,
    @Query('eventType') eventType?: VerificationEventType,
    @Query('email') email?: string,
  ) {
    return this.verificationService.findAll({
      limit: limit ? +limit : undefined,
      offset: offset ? +offset : undefined,
      status,
      eventType,
      email,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Statistiques des codes de vérification' })
  @ApiResponse({ status: 200, description: 'Statistiques' })
  async getStats() {
    return this.verificationService.getStats();
  }

  @Get('email/:email')
  @ApiOperation({ summary: 'Codes de vérification pour un email' })
  @ApiResponse({ status: 200, description: 'Liste des codes' })
  async findByEmail(@Param('email') email: string) {
    return this.verificationService.findByEmail(email);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détails d\'un code de vérification' })
  @ApiResponse({ status: 200, description: 'Détails du code' })
  @ApiResponse({ status: 404, description: 'Code non trouvé' })
  async findOne(@Param('id') id: string) {
    return this.verificationService.findOne(id);
  }

  @Post(':id/mark-used')
  @ApiOperation({ summary: 'Marquer un code comme utilisé' })
  @ApiResponse({ status: 200, description: 'Code marqué comme utilisé' })
  async markAsUsed(
    @Param('id') id: string,
    @Body('ipAddress') ipAddress?: string,
  ) {
    return this.verificationService.markAsUsed(id, ipAddress);
  }

  @Post(':id/retry')
  @ApiOperation({ summary: 'Réessayer l\'envoi d\'un email échoué' })
  @ApiResponse({ status: 200, description: 'Email renvoyé' })
  @ApiResponse({ status: 400, description: 'Impossible de réessayer' })
  async retryEmail(@Param('id') id: string) {
    return this.verificationService.retryEmail(id);
  }

  @Post('cleanup')
  @ApiOperation({ summary: 'Nettoyer les codes expirés' })
  @ApiResponse({ status: 200, description: 'Codes nettoyés' })
  async cleanupExpired() {
    const count = await this.verificationService.cleanupExpired();
    return {
      message: `${count} codes expirés nettoyés`,
      count,
    };
  }
}
