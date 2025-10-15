import { Controller, Post, Body, HttpCode, HttpStatus, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signup.dto';
import { SignInDto } from './dto/signin.dto';
import { ConfirmSignUpDto } from './dto/confirm-signup.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ConfirmForgotPasswordDto } from './dto/confirm-forgot-password.dto';
import { CognitoJwtAuthGuard } from './guards/cognito-jwt-auth.guard';
import { CurrentUser, CognitoUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';

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
}
