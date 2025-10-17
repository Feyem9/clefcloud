import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CognitoService } from '../aws/cognito.service';
import { User } from '../users/entities/user.entity';
import { SignUpDto } from './dto/signup.dto';
import { SignInDto } from './dto/signin.dto';
import { MailService } from '../mail.service';
import { ConfirmSignUpDto } from './dto/confirm-signup.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ConfirmForgotPasswordDto } from './dto/confirm-forgot-password.dto';
import { VerificationCode, VerificationEventType, VerificationStatus } from '../verification/entities/verification-code.entity';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(VerificationCode)
    private verificationRepo: Repository<VerificationCode>,
    private cognitoService: CognitoService,
    private mailService: MailService,
    private configService: ConfigService,
  ) {}

  async signUp(signUpDto: SignUpDto) {
    const { email, password, name, phone } = signUpDto;

    const result = await this.cognitoService.signUp(email, password, name, phone);

    // Si l'utilisateur n'est pas confirmé, générer et envoyer notre propre code
    if (!result.userConfirmed) {
      this.logger.log(`📧 Génération et envoi du code de vérification à ${email}`);
      
      // Générer un code à 6 chiffres
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Sauvegarder le code dans PostgreSQL
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // Expire dans 24h
      
      const verification = this.verificationRepo.create({
        userId: result.userSub,
        userPoolId: this.cognitoService['userPoolId'],
        email,
        phoneNumber: phone,
        verificationCode,
        triggerSource: 'CustomMessage_SignUp',
        eventType: VerificationEventType.SIGNUP,
        expiresAt,
        status: VerificationStatus.PENDING,
      });
      
      await this.verificationRepo.save(verification);
      this.logger.log(`✅ Code sauvegardé en base - ID: ${verification.id}`);
      
      // Publier dans RabbitMQ pour envoi asynchrone
      await this.publishVerificationCode({
        id: verification.id,
        email,
        code: verificationCode,
        eventType: 'SIGNUP',
        expiresAt: expiresAt.toISOString(),
      });
    }

    return {
      message: 'User created successfully. Please check your email for verification code.',
      userSub: result.userSub,
      userConfirmed: result.userConfirmed,
    };
  }

  async confirmSignUp(confirmSignUpDto: ConfirmSignUpDto) {
    const { email, code } = confirmSignUpDto;

    // Vérifier notre code dans PostgreSQL
    const verification = await this.verificationRepo.findOne({
      where: {
        email,
        verificationCode: code,
        status: VerificationStatus.PENDING,
      },
      order: { createdAt: 'DESC' },
    });

    if (!verification) {
      throw new Error('Code de vérification invalide ou expiré');
    }

    if (verification.isExpired()) {
      verification.status = VerificationStatus.EXPIRED;
      await this.verificationRepo.save(verification);
      throw new Error('Code de vérification expiré');
    }

    // Marquer le code comme utilisé
    verification.markAsUsed();
    await this.verificationRepo.save(verification);

    // Confirmer l'utilisateur dans Cognito via admin (sans code Cognito)
    await this.cognitoService.adminConfirmSignUp(email);

    this.logger.log(`✅ Utilisateur confirmé: ${email}`);

    // On envoie l'email de bienvenue après confirmation
    const user = await this.userRepository.findOne({ where: { email } });
    if (user) {
      // N'attend pas la fin de l'envoi pour ne pas bloquer la réponse HTTP
      this.mailService.sendWelcomeEmail(user);
    }

    return {
      message: 'Email confirmed successfully',
    };
  }

  /**
   * Confirmation admin (pour développement uniquement)
   */
  async adminConfirmSignUp(email: string) {
    return this.cognitoService.adminConfirmSignUp(email);
  }

  async signIn(signInDto: SignInDto) {
    const { email, password } = signInDto;

    const tokens = await this.cognitoService.signIn(email, password);

    // Obtenir les infos utilisateur depuis Cognito
    const cognitoUser = await this.cognitoService.getUserFromToken(tokens.accessToken);

    // Décoder le JWT pour obtenir le sub (payload.sub)
    // Le sub est dans le token, pas dans les attributes de GetUser
    const tokenPayload = JSON.parse(
      Buffer.from(tokens.accessToken.split('.')[1], 'base64').toString()
    );
    const cognitoSub = tokenPayload.sub;

    // Créer ou mettre à jour l'utilisateur dans la base de données
    let user = await this.userRepository.findOne({
      where: { cognito_sub: cognitoSub },
    });

    if (!user) {
      user = this.userRepository.create({
        cognito_sub: cognitoSub,
        email: cognitoUser.attributes['email'],
        name: cognitoUser.attributes['name'] || email.split('@')[0],
      });
      await this.userRepository.save(user);
      this.logger.log(`New user created in database: ${user.email} (sub: ${cognitoSub})`);
    } else {
      user.updated_at = new Date();
      await this.userRepository.save(user);
    }

    return {
      tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        cognitoSub: user.cognito_sub,
      },
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    await this.cognitoService.forgotPassword(email);

    return {
      message: 'Password reset code sent to your email',
    };
  }

  async confirmForgotPassword(confirmForgotPasswordDto: ConfirmForgotPasswordDto) {
    const { email, code, newPassword } = confirmForgotPasswordDto;

    await this.cognitoService.confirmForgotPassword(email, code, newPassword);

    return {
      message: 'Password reset successfully',
    };
  }

  async validateToken(accessToken: string) {
    const cognitoUser = await this.cognitoService.getUserFromToken(accessToken);

    const user = await this.userRepository.findOne({
      where: { cognito_sub: cognitoUser.username },
    });

    return user;
  }

  async refreshToken(refreshToken: string, email: string) {
    const tokens = await this.cognitoService.refreshToken(refreshToken, email);

    return {
      message: 'Token refreshed successfully',
      tokens,
    };
  }

  async signOut(accessToken: string) {
    await this.cognitoService.signOut(accessToken);

    return {
      message: 'Signed out successfully',
    };
  }

  async changePassword(accessToken: string, oldPassword: string, newPassword: string) {
    await this.cognitoService.changePassword(accessToken, oldPassword, newPassword);

    return {
      message: 'Password changed successfully',
    };
  }

  async deleteAccount(accessToken: string, cognitoSub: string) {
    // Supprimer le compte Cognito
    await this.cognitoService.deleteUser(accessToken);

    // Supprimer l'utilisateur de la base de données
    const user = await this.userRepository.findOne({
      where: { cognito_sub: cognitoSub },
    });

    if (user) {
      await this.userRepository.remove(user);
      this.logger.log(`User deleted from database: ${user.email}`);
    }

    return {
      message: 'Account deleted successfully',
    };
  }

  async resendConfirmationCode(email: string) {
    await this.cognitoService.resendConfirmationCode(email);

    return {
      message: 'Confirmation code resent successfully',
    };
  }

  /**
   * Publier un code de vérification dans RabbitMQ
   */
  private async publishVerificationCode(data: {
    id: string;
    email: string;
    code: string;
    eventType: string;
    expiresAt: string;
  }) {
    const rabbitmqUrl = this.configService.get<string>('RABBITMQ_URL');
    
    if (!rabbitmqUrl) {
      this.logger.warn('⚠️  RABBITMQ_URL not configured, sending email directly');
      // Fallback: envoyer directement
      await this.mailService.sendVerificationEmail(data.email, data.code);
      return;
    }

    let connection;
    let channel;

    try {
      this.logger.log('📨 [RabbitMQ] Publication du code de vérification');
      
      connection = await amqp.connect(rabbitmqUrl);
      channel = await connection.createChannel();

      const queueName = 'auth-verification-codes';
      await channel.assertQueue(queueName, { durable: true });

      const message = {
        ...data,
        timestamp: new Date().toISOString(),
      };

      channel.sendToQueue(
        queueName,
        Buffer.from(JSON.stringify(message)),
        { persistent: true }
      );

      this.logger.log(`✅ [RabbitMQ] Code publié dans la queue: ${queueName}`);

      await channel.close();
      await connection.close();
    } catch (error) {
      this.logger.error('❌ [RabbitMQ] Erreur lors de la publication:', error);
      
      // Fermer les connexions en cas d'erreur
      if (channel) await channel.close().catch(() => {});
      if (connection) await connection.close().catch(() => {});
      
      // Fallback: envoyer directement
      this.logger.log('📧 Fallback: envoi direct de l\'email');
      await this.mailService.sendVerificationEmail(data.email, data.code);
    }
  }

  /**
   * Réinitialiser le mot de passe en mode admin (sans code)
   * ⚠️ DEV ONLY - Ne pas utiliser en production
   */
  async adminResetPassword(email: string, newPassword: string) {
    return this.cognitoService.adminSetPassword(email, newPassword);
  }
}
