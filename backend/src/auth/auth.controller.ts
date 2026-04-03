import { Controller, Post, Body, Get, Put, Delete, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('validate')
  @ApiOperation({ summary: 'Valide un token Firebase et synchronise l\'utilisateur' })
  async validateToken(@Body('token') token: string) {
    return this.authService.validateFirebaseUser(token);
  }

  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupère le profil de l\'utilisateur connecté avec stats' })
  async getProfile(@Req() req) {
    const stats = await this.authService.getProfileStats(req.user);
    return {
      ...req.user,
      ...stats,
    };
  }

  @Put('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Met à jour le profil de l\'utilisateur connecté' })
  async updateProfile(@Req() req, @Body() data: { name?: string; title?: string; avatar_url?: string }) {
    return this.authService.updateProfile(req.user, data);
  }

  @Delete('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprime définitivement le compte de l\'utilisateur' })
  async deleteAccount(@Req() req) {
    return this.authService.deleteAccount(req.user);
  }
}
