import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  InitiateAuthCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  AdminGetUserCommand,
  GetUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { createHmac, randomUUID } from 'crypto';


@Injectable()
export class CognitoService {
  private readonly logger = new Logger(CognitoService.name);
  private readonly cognitoClient: CognitoIdentityProviderClient;
  private readonly userPoolId: string;
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor(private configService: ConfigService) {
    const region = this.configService.get('AWS_REGION', 'eu-west-1');
    this.userPoolId = this.configService.get('COGNITO_USER_POOL_ID');
    this.clientId = this.configService.get('COGNITO_CLIENT_ID');
    this.clientSecret = this.configService.get<string>('COGNITO_CLIENT_SECRET');


    const credentials = this.configService.get('AWS_ACCESS_KEY_ID')
      ? {
          accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
          secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
        }
      : undefined;

    this.cognitoClient = new CognitoIdentityProviderClient({
      region,
      credentials,
    });

    this.logger.log(`Cognito Service initialized - UserPoolId: ${this.userPoolId}`);
  }

   // 2. Ajoutez cette méthode pour calculer le hash
   private createSecretHash(username: string): string {
    return createHmac('sha256', this.clientSecret)
      .update(username + this.clientId)
      .digest('base64');
  }

  /**
   * Inscription d'un nouvel utilisateur
   */
  async signUp(email: string, password: string, name?: string, phone?: string) {
    const username = randomUUID(); // Utiliser un UUID comme nom d'utilisateur

    // 3. Calculez le hash avant d'envoyer la commande
    const secretHash = this.createSecretHash(username);

    try {
      const command = new SignUpCommand({
        ClientId: this.clientId,
        Username: username,
        Password: password,
        SecretHash: secretHash,
        UserAttributes: [
          { Name: 'email', Value: email },
          ...(name ? [{ Name: 'name', Value: name }] : []),
          ...(phone ? [{ Name: 'phone_number', Value: phone }] : []),
        ],
      });

      const result = await this.cognitoClient.send(command);
      this.logger.log(`User signed up: ${email}`);

      return {
        userSub: result.UserSub,
        userConfirmed: result.UserConfirmed,
      };
    } catch (error) {
      this.logger.error(`Sign up failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Confirmation d'inscription
   */
  async confirmSignUp(email: string, code: string) {
    // Le SecretHash est requis ici aussi si le client a un secret.
    const secretHash = this.createSecretHash(email);
    try {
      const command = new ConfirmSignUpCommand({
        ClientId: this.clientId,
        Username: email,
        SecretHash: secretHash,
        ConfirmationCode: code,
      });

      await this.cognitoClient.send(command);
      this.logger.log(`User confirmed: ${email}`);
    } catch (error) {
      this.logger.error(`Confirmation failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Connexion utilisateur
   */
  async signIn(email: string, password: string) {
    // Le hash doit être calculé avec l'email (qui est le 'USERNAME' pour la connexion)
    const secretHash = this.createSecretHash(email);

    try {
      const command = new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: this.clientId,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
          SECRET_HASH: secretHash,
        },
      });

      const result = await this.cognitoClient.send(command);
      this.logger.log(`User signed in: ${email}`);

      return {
        accessToken: result.AuthenticationResult.AccessToken,
        idToken: result.AuthenticationResult.IdToken,
        refreshToken: result.AuthenticationResult.RefreshToken,
        expiresIn: result.AuthenticationResult.ExpiresIn,
      };
    } catch (error) {
      this.logger.error(`Sign in failed: ${error.message}`, error.stack);
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  /**
   * Mot de passe oublié
   */
  async forgotPassword(email: string) {
    const secretHash = this.createSecretHash(email);
    try {
      const command = new ForgotPasswordCommand({
        ClientId: this.clientId,
        Username: email,
        SecretHash: secretHash,
      });

      await this.cognitoClient.send(command);
      this.logger.log(`Password reset requested: ${email}`);
    } catch (error) {
      this.logger.error(`Forgot password failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Confirmer le nouveau mot de passe
   */
  async confirmForgotPassword(email: string, code: string, newPassword: string) {
    const secretHash = this.createSecretHash(email);
    try {
      const command = new ConfirmForgotPasswordCommand({
        ClientId: this.clientId,
        Username: email,
        ConfirmationCode: code,
        Password: newPassword,
        SecretHash: secretHash,
      });

      await this.cognitoClient.send(command);
      this.logger.log(`Password reset confirmed: ${email}`);
    } catch (error) {
      this.logger.error(`Confirm forgot password failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Obtenir les informations d'un utilisateur via son token
   */
  async getUserFromToken(accessToken: string) {
    try {
      const command = new GetUserCommand({
        AccessToken: accessToken,
      });

      const result = await this.cognitoClient.send(command);

      return {
        username: result.Username,
        attributes: result.UserAttributes.reduce((acc, attr) => {
          acc[attr.Name] = attr.Value;
          return acc;
        }, {}),
      };
    } catch (error) {
      this.logger.error(`Get user failed: ${error.message}`, error.stack);
      throw new UnauthorizedException('Invalid token');
    }
  }

  /**
   * Obtenir un utilisateur par son username (admin)
   */
  async getUser(username: string) {
    try {
      const command = new AdminGetUserCommand({
        UserPoolId: this.userPoolId,
        Username: username,
      });

      const result = await this.cognitoClient.send(command);

      return {
        username: result.Username,
        userStatus: result.UserStatus,
        attributes: result.UserAttributes.reduce((acc, attr) => {
          acc[attr.Name] = attr.Value;
          return acc;
        }, {}),
      };
    } catch (error) {
      this.logger.error(`Get user failed: ${error.message}`, error.stack);
      throw error;
    }
  }
}
