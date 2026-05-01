import { Controller, Post, Body, Get, Put, Delete, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { Public } from '../common/decorators/public.decorator';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Public()
  @Post('validate')
  @ApiOperation({ summary: "Valide un token Firebase et synchronise l'utilisateur" })
  async validateToken(@Body('token') token: string) {
    return this.authService.validateFirebaseUser(token);
  }

  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Récupère le profil de l'utilisateur connecté avec stats" })
  async getProfile(@Req() req: RequestWithUser) {
    const stats = await this.authService.getProfileStats(req.user);
    return { ...req.user, ...stats };
  }

  @Put('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Met à jour le profil de l'utilisateur connecté" })
  async updateProfile(@Req() req: RequestWithUser, @Body('name') name: string) {
    return this.authService.updateProfile(req.user, name);
  }

  @Delete('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Supprime définitivement le compte de l'utilisateur" })
  async deleteAccount(@Req() req: RequestWithUser) {
    return this.authService.deleteAccount(req.user);
  }
}
