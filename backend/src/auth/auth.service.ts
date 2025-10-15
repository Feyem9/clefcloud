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

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private cognitoService: CognitoService,
    private mailService: MailService,
  ) {}

  async signUp(signUpDto: SignUpDto) {
    const { email, password, name, phone } = signUpDto;

    const result = await this.cognitoService.signUp(email, password, name, phone);

    return {
      message: 'User created successfully. Please check your email for verification code.',
      userSub: result.userSub,
      userConfirmed: result.userConfirmed,
    };
  }

  async confirmSignUp(confirmSignUpDto: ConfirmSignUpDto) {
    const { email, code } = confirmSignUpDto;

    await this.cognitoService.confirmSignUp(email, code);

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

  async signIn(signInDto: SignInDto) {
    const { email, password } = signInDto;

    const tokens = await this.cognitoService.signIn(email, password);

    // Obtenir les infos utilisateur depuis Cognito
    const cognitoUser = await this.cognitoService.getUserFromToken(tokens.accessToken);

    // Créer ou mettre à jour l'utilisateur dans la base de données
    let user = await this.userRepository.findOne({
      where: { cognito_sub: cognitoUser.username },
    });

    if (!user) {
      user = this.userRepository.create({
        cognito_sub: cognitoUser.username,
        email: cognitoUser.attributes['email'],
        name: cognitoUser.attributes['name'] || email.split('@')[0],
      });
      await this.userRepository.save(user);
      this.logger.log(`New user created in database: ${user.email}`);
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
}
