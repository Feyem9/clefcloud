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
  GlobalSignOutCommand,
  ChangePasswordCommand,
  DeleteUserCommand,
  ResendConfirmationCodeCommand,
  AdminConfirmSignUpCommand,
  AdminSetUserPasswordCommand,
  AdminUpdateUserAttributesCommand,
  ListUsersCommand,
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
   * Note: Le User Pool est configuré avec email alias, donc on utilise un UUID comme username
   * et Cognito permet de se connecter avec l'email directement
   */
  async signUp(email: string, password: string, name?: string, phone?: string) {
    // Utiliser un UUID comme username car le pool utilise email alias
    const username = randomUUID();

    // Calculer le hash avec le username UUID
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
      this.logger.log(`User signed up: ${email} (username: ${username})`);

      return {
        userSub: result.UserSub,
        userConfirmed: result.UserConfirmed,
        username: username, // Retourner le username UUID
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
   * Confirmation d'inscription par admin (sans code - pour développement uniquement)
   * Nécessite des credentials AWS avec les permissions appropriées
   */
  async adminConfirmSignUp(email: string) {
    try {
      // Trouver l'utilisateur par email car le username est un UUID
      const listCommand = new ListUsersCommand({
        UserPoolId: this.userPoolId,
        Filter: `email = "${email}"`,
        Limit: 1,
      });

      const listResult = await this.cognitoClient.send(listCommand);

      if (!listResult.Users || listResult.Users.length === 0) {
        throw new Error(`User with email ${email} not found`);
      }

      const username = listResult.Users[0].Username;
      this.logger.log(`Found user: ${email} with username: ${username}`);

      // Confirmer avec le vrai username UUID
      const confirmCommand = new AdminConfirmSignUpCommand({
        UserPoolId: this.userPoolId,
        Username: username,
      });

      await this.cognitoClient.send(confirmCommand);
      this.logger.log(`User confirmed by admin: ${email} (username: ${username})`);
      
      // Marquer l'email comme vérifié
      const updateCommand = new AdminUpdateUserAttributesCommand({
        UserPoolId: this.userPoolId,
        Username: username,
        UserAttributes: [
          { Name: 'email_verified', Value: 'true' },
        ],
      });
      
      await this.cognitoClient.send(updateCommand);
      this.logger.log(`Email marked as verified for: ${email}`);
      
      return { 
        message: 'User confirmed successfully',
        email,
        username,
      };
    } catch (error) {
      this.logger.error(`Admin confirmation failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Connexion utilisateur
   * Note: Avec email alias, on peut utiliser l'email pour se connecter,
   * mais le SECRET_HASH doit être calculé avec le vrai username (UUID)
   */
  async signIn(email: string, password: string) {
    try {
      // Trouver le vrai username (UUID) à partir de l'email
      const listCommand = new ListUsersCommand({
        UserPoolId: this.userPoolId,
        Filter: `email = "${email}"`,
        Limit: 1,
      });

      const listResult = await this.cognitoClient.send(listCommand);

      if (!listResult.Users || listResult.Users.length === 0) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const username = listResult.Users[0].Username;
      this.logger.log(`Found username for ${email}: ${username}`);

      // Calculer le SECRET_HASH avec le vrai username (UUID)
      const secretHash = this.createSecretHash(username);

      const command = new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: this.clientId,
        AuthParameters: {
          USERNAME: username, // Utiliser le vrai username UUID
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
   * Note: Le SECRET_HASH doit être calculé avec le vrai username (UUID), pas l'email
   */
  async forgotPassword(email: string) {
    try {
      // Trouver le vrai username (UUID) à partir de l'email
      const listCommand = new ListUsersCommand({
        UserPoolId: this.userPoolId,
        Filter: `email = "${email}"`,
        Limit: 1,
      });

      const listResult = await this.cognitoClient.send(listCommand);

      if (!listResult.Users || listResult.Users.length === 0) {
        throw new Error('User not found');
      }

      const username = listResult.Users[0].Username;
      this.logger.log(`Found username for forgot password: ${email} -> ${username}`);

      // Calculer le SECRET_HASH avec le vrai username UUID
      const secretHash = this.createSecretHash(username);

      const command = new ForgotPasswordCommand({
        ClientId: this.clientId,
        Username: username, // Utiliser le vrai username UUID
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
   * Note: Le SECRET_HASH doit être calculé avec le vrai username (UUID), pas l'email
   */
  async confirmForgotPassword(email: string, code: string, newPassword: string) {
    try {
      // Trouver le vrai username (UUID) à partir de l'email
      const listCommand = new ListUsersCommand({
        UserPoolId: this.userPoolId,
        Filter: `email = "${email}"`,
        Limit: 1,
      });

      const listResult = await this.cognitoClient.send(listCommand);

      if (!listResult.Users || listResult.Users.length === 0) {
        throw new Error('User not found');
      }

      const username = listResult.Users[0].Username;
      this.logger.log(`Found username for confirm forgot password: ${email} -> ${username}`);

      // Calculer le SECRET_HASH avec le vrai username UUID
      const secretHash = this.createSecretHash(username);

      const command = new ConfirmForgotPasswordCommand({
        ClientId: this.clientId,
        Username: username, // Utiliser le vrai username UUID
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

  /**
   * Rafraîchir le token d'accès
   * Note: Le username passé est l'email, mais le SECRET_HASH doit être calculé avec le vrai username UUID
   */
  async refreshToken(refreshToken: string, email: string) {
    try {
      // Trouver le vrai username (UUID) à partir de l'email
      const listCommand = new ListUsersCommand({
        UserPoolId: this.userPoolId,
        Filter: `email = "${email}"`,
        Limit: 1,
      });

      const listResult = await this.cognitoClient.send(listCommand);

      if (!listResult.Users || listResult.Users.length === 0) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const username = listResult.Users[0].Username;
      this.logger.log(`Found username for refresh: ${email} -> ${username}`);

      // Calculer le SECRET_HASH avec le vrai username UUID
      const secretHash = this.createSecretHash(username);

      const command = new InitiateAuthCommand({
        AuthFlow: 'REFRESH_TOKEN_AUTH',
        ClientId: this.clientId,
        AuthParameters: {
          REFRESH_TOKEN: refreshToken,
          SECRET_HASH: secretHash,
        },
      });

      const result = await this.cognitoClient.send(command);
      this.logger.log(`Token refreshed for user: ${email}`);

      return {
        accessToken: result.AuthenticationResult.AccessToken,
        idToken: result.AuthenticationResult.IdToken,
        expiresIn: result.AuthenticationResult.ExpiresIn,
      };
    } catch (error) {
      this.logger.error(`Refresh token failed: ${error.message}`, error.stack);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Déconnexion globale (invalide tous les tokens)
   */
  async signOut(accessToken: string) {
    try {
      const command = new GlobalSignOutCommand({
        AccessToken: accessToken,
      });

      await this.cognitoClient.send(command);
      this.logger.log('User signed out globally');
    } catch (error) {
      this.logger.error(`Sign out failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Changer le mot de passe (utilisateur connecté)
   */
  async changePassword(accessToken: string, oldPassword: string, newPassword: string) {
    try {
      const command = new ChangePasswordCommand({
        AccessToken: accessToken,
        PreviousPassword: oldPassword,
        ProposedPassword: newPassword,
      });

      await this.cognitoClient.send(command);
      this.logger.log('Password changed successfully');
    } catch (error) {
      this.logger.error(`Change password failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Supprimer le compte utilisateur
   */
  async deleteUser(accessToken: string) {
    try {
      const command = new DeleteUserCommand({
        AccessToken: accessToken,
      });

      await this.cognitoClient.send(command);
      this.logger.log('User account deleted');
    } catch (error) {
      this.logger.error(`Delete user failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Renvoyer le code de confirmation
   */
  async resendConfirmationCode(email: string) {
    const secretHash = this.createSecretHash(email);
    try {
      const command = new ResendConfirmationCodeCommand({
        ClientId: this.clientId,
        Username: email,
        SecretHash: secretHash,
      });

      await this.cognitoClient.send(command);
      this.logger.log(`Confirmation code resent to: ${email}`);
    } catch (error) {
      this.logger.error(`Resend confirmation code failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Réinitialiser le mot de passe en mode admin (sans code)
   * ⚠️ DEV ONLY - Utilise les privilèges admin pour définir directement le mot de passe
   */
  async adminSetPassword(email: string, newPassword: string) {
    try {
      // Trouver le vrai username (UUID) à partir de l'email
      const listCommand = new ListUsersCommand({
        UserPoolId: this.userPoolId,
        Filter: `email = "${email}"`,
        Limit: 1,
      });

      const listResult = await this.cognitoClient.send(listCommand);

      if (!listResult.Users || listResult.Users.length === 0) {
        throw new Error('User not found');
      }

      const username = listResult.Users[0].Username;
      this.logger.log(`Admin setting password for: ${email} -> ${username}`);

      const command = new AdminSetUserPasswordCommand({
        UserPoolId: this.userPoolId,
        Username: username,
        Password: newPassword,
        Permanent: true, // Le mot de passe est permanent (pas temporaire)
      });

      await this.cognitoClient.send(command);
      this.logger.log(`Password set successfully for: ${email}`);

      return {
        message: 'Password reset successfully (admin mode)',
        email,
      };
    } catch (error) {
      this.logger.error(`Admin set password failed: ${error.message}`, error.stack);
      throw error;
    }
  }
}
