import { Controller, Post, Body, HttpCode, HttpStatus, Get, UseGuards, Delete, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signup.dto';
import { SignInDto } from './dto/signin.dto';
import { ConfirmSignUpDto } from './dto/confirm-signup.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ConfirmForgotPasswordDto } from './dto/confirm-forgot-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ResendCodeDto } from './dto/resend-code.dto';
import { CognitoJwtAuthGuard } from './guards/cognito-jwt-auth.guard';
import { CurrentUser, CognitoUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { Request } from 'express';

@ApiTags('auth')
@Controller('auth')
@UseGuards(CognitoJwtAuthGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  @ApiOperation({ summary: 'Inscription d\'un nouvel utilisateur' })
  @ApiResponse({ status: 201, description: 'Utilisateur créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto);
  }

  @Public()
  @Post('confirm-signup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirmer l\'inscription avec le code reçu par email' })
  @ApiResponse({ status: 200, description: 'Email confirmé avec succès' })
  @ApiResponse({ status: 400, description: 'Code invalide' })
  async confirmSignUp(@Body() confirmSignUpDto: ConfirmSignUpDto) {
    return this.authService.confirmSignUp(confirmSignUpDto);
  }

  @Public()
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Connexion utilisateur' })
  @ApiResponse({ status: 200, description: 'Connexion réussie' })
  @ApiResponse({ status: 401, description: 'Identifiants invalides' })
  async signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Demander un code de réinitialisation de mot de passe' })
  @ApiResponse({ status: 200, description: 'Code envoyé par email' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Public()
  @Post('confirm-forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirmer le nouveau mot de passe' })
  @ApiResponse({ status: 200, description: 'Mot de passe réinitialisé avec succès' })
  @ApiResponse({ status: 400, description: 'Code invalide' })
  async confirmForgotPassword(@Body() confirmForgotPasswordDto: ConfirmForgotPasswordDto) {
    return this.authService.confirmForgotPassword(confirmForgotPasswordDto);
  }

  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer le profil de l\'utilisateur connecté (protégé par JWT)' })
  @ApiResponse({ status: 200, description: 'Profil utilisateur' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async getProfile(@CurrentUser() user: CognitoUser) {
    return {
      message: 'Profil utilisateur récupéré avec succès',
      user,
    };
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer les informations de l\'utilisateur connecté' })
  @ApiResponse({ status: 200, description: 'Informations utilisateur' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async getCurrentUser(@CurrentUser() user: CognitoUser) {
    return user;
  }

  @Public()
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rafraîchir le token d\'accès' })
  @ApiResponse({ status: 200, description: 'Token rafraîchi avec succès' })
  @ApiResponse({ status: 401, description: 'Refresh token invalide' })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken, refreshTokenDto.email);
  }

  @Post('signout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Déconnexion (invalide tous les tokens)' })
  @ApiResponse({ status: 200, description: 'Déconnexion réussie' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async signOut(@Req() request: Request) {
    const token = request.headers.authorization?.replace('Bearer ', '');
    return this.authService.signOut(token);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Changer le mot de passe (utilisateur connecté)' })
  @ApiResponse({ status: 200, description: 'Mot de passe changé avec succès' })
  @ApiResponse({ status: 400, description: 'Ancien mot de passe incorrect' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Req() request: Request,
  ) {
    const token = request.headers.authorization?.replace('Bearer ', '');
    return this.authService.changePassword(
      token,
      changePasswordDto.oldPassword,
      changePasswordDto.newPassword,
    );
  }

  @Delete('account')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer le compte utilisateur' })
  @ApiResponse({ status: 200, description: 'Compte supprimé avec succès' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async deleteAccount(
    @CurrentUser() user: CognitoUser,
    @Req() request: Request,
  ) {
    const token = request.headers.authorization?.replace('Bearer ', '');
    return this.authService.deleteAccount(token, user.username);
  }

  @Public()
  @Post('resend-confirmation-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renvoyer le code de confirmation' })
  @ApiResponse({ status: 200, description: 'Code renvoyé avec succès' })
  @ApiResponse({ status: 400, description: 'Utilisateur déjà confirmé ou introuvable' })
  async resendConfirmationCode(@Body() resendCodeDto: ResendCodeDto) {
    return this.authService.resendConfirmationCode(resendCodeDto.email);
  }

  @Public()
  @Post('admin-confirm-signup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirmer un utilisateur sans code (DEV ONLY)' })
  @ApiResponse({ status: 200, description: 'Utilisateur confirmé avec succès' })
  @ApiResponse({ status: 400, description: 'Erreur de confirmation' })
  async adminConfirmSignUp(@Body() body: { email: string }) {
    return this.authService.adminConfirmSignUp(body.email);
  }

  @Public()
  @Post('admin-reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Réinitialiser le mot de passe sans code (DEV ONLY)' })
  @ApiResponse({ status: 200, description: 'Mot de passe réinitialisé avec succès' })
  @ApiResponse({ status: 400, description: 'Erreur de réinitialisation' })
  async adminResetPassword(@Body() body: { email: string; newPassword: string }) {
    return this.authService.adminResetPassword(body.email, body.newPassword);
  }
}
