import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
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
  @ApiOperation({ summary: 'Récupère le profil de l\'utilisateur connecté' })
  async getProfile(@Req() req) {
    return req.user;
  }
}
