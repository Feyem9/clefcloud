import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import { VerificationEventType } from './entities/verification-code.entity';

// SendGrid (optionnel)
// import * as sgMail from '@sendgrid/mail';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly ses: AWS.SES;
  private readonly provider: 'SES' | 'SendGrid';
  private readonly fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    this.provider = this.configService.get<'SES' | 'SendGrid'>('EMAIL_PROVIDER') || 'SES';
    this.fromEmail = this.configService.get<string>('FROM_EMAIL') || 'noreply@clefcloud.com';

    if (this.provider === 'SES') {
      this.ses = new AWS.SES({
        region: this.configService.get<string>('AWS_REGION') || 'us-east-1',
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
      });
      this.logger.log('📧 Email provider: AWS SES');
    } else {
      // Configuration SendGrid
      // const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
      // sgMail.setApiKey(apiKey);
      this.logger.log('📧 Email provider: SendGrid');
    }
  }

  /**
   * Envoyer un email de vérification
   */
  async sendVerificationEmail(data: {
    to: string;
    code: string;
    eventType: VerificationEventType;
    expiresAt: Date;
  }): Promise<{ provider: string; messageId: string }> {
    const { subject, htmlBody } = this.buildEmailContent(data);

    if (this.provider === 'SES') {
      return this.sendViaSES(data.to, subject, htmlBody);
    } else {
      return this.sendViaSendGrid(data.to, subject, htmlBody);
    }
  }

  /**
   * Envoyer via AWS SES
   */
  private async sendViaSES(
    to: string,
    subject: string,
    htmlBody: string,
  ): Promise<{ provider: string; messageId: string }> {
    try {
      const params: AWS.SES.SendEmailRequest = {
        Source: this.fromEmail,
        Destination: {
          ToAddresses: [to],
        },
        Message: {
          Subject: {
            Data: subject,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: htmlBody,
              Charset: 'UTF-8',
            },
          },
        },
      };

      const result = await this.ses.sendEmail(params).promise();
      
      this.logger.log(`✅ [SES] Email envoyé - MessageId: ${result.MessageId}`);

      return {
        provider: 'SES',
        messageId: result.MessageId,
      };

    } catch (error) {
      this.logger.error(`❌ [SES] Erreur:`, error);
      throw error;
    }
  }

  /**
   * Envoyer via SendGrid
   */
  private async sendViaSendGrid(
    to: string,
    subject: string,
    htmlBody: string,
  ): Promise<{ provider: string; messageId: string }> {
    try {
      // Décommentez si vous utilisez SendGrid
      /*
      const msg = {
        to,
        from: this.fromEmail,
        subject,
        html: htmlBody,
      };

      const [response] = await sgMail.send(msg);
      
      this.logger.log(`✅ [SendGrid] Email envoyé - MessageId: ${response.headers['x-message-id']}`);

      return {
        provider: 'SendGrid',
        messageId: response.headers['x-message-id'],
      };
      */

      // Placeholder
      throw new Error('SendGrid not configured');

    } catch (error) {
      this.logger.error(`❌ [SendGrid] Erreur:`, error);
      throw error;
    }
  }

  /**
   * Construire le contenu de l'email
   */
  private buildEmailContent(data: {
    code: string;
    eventType: VerificationEventType;
    expiresAt: Date;
  }): { subject: string; htmlBody: string } {
    const { code, eventType, expiresAt } = data;

    const expiresIn = this.getExpirationText(expiresAt);

    const templates = {
      [VerificationEventType.SIGNUP]: {
        subject: '🎵 Bienvenue sur ClefCloud !',
        title: 'Bienvenue sur ClefCloud !',
        message: 'Merci de vous être inscrit. Voici votre code de vérification :',
        gradient: 'linear-gradient(135deg, #8C48FF, #F2598A, #FFB152)',
      },
      [VerificationEventType.FORGOT_PASSWORD]: {
        subject: '🔑 Réinitialisation de votre mot de passe',
        title: 'Réinitialisation du mot de passe',
        message: 'Vous avez demandé à réinitialiser votre mot de passe. Voici votre code :',
        gradient: 'linear-gradient(135deg, #FFB152, #F2598A, #8C48FF)',
      },
      [VerificationEventType.RESEND_CODE]: {
        subject: '🔄 Nouveau code de vérification',
        title: 'Nouveau code de vérification',
        message: 'Voici votre nouveau code de vérification :',
        gradient: 'linear-gradient(135deg, #8C48FF, #F2598A, #FFB152)',
      },
      [VerificationEventType.VERIFY_ATTRIBUTE]: {
        subject: '✅ Vérification de votre compte',
        title: 'Vérification de compte',
        message: 'Voici votre code de vérification :',
        gradient: 'linear-gradient(135deg, #8C48FF, #F2598A, #FFB152)',
      },
      [VerificationEventType.AUTHENTICATION]: {
        subject: '🔐 Code d\'authentification',
        title: 'Authentification',
        message: 'Voici votre code d\'authentification :',
        gradient: 'linear-gradient(135deg, #8C48FF, #F2598A, #FFB152)',
      },
    };

    const template = templates[eventType] || templates[VerificationEventType.SIGNUP];

    const htmlBody = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${template.subject}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          }
          .header {
            background: ${template.gradient};
            padding: 40px 20px;
            text-align: center;
          }
          .header h1 {
            color: white;
            margin: 0;
            font-size: 32px;
          }
          .content {
            padding: 40px 30px;
          }
          .content h2 {
            color: #333;
            font-size: 24px;
            margin-bottom: 20px;
          }
          .content p {
            color: #666;
            font-size: 16px;
            margin-bottom: 30px;
          }
          .code-box {
            background: ${template.gradient};
            padding: 30px;
            border-radius: 12px;
            text-align: center;
            margin: 30px 0;
          }
          .code {
            color: white;
            font-size: 48px;
            font-weight: bold;
            letter-spacing: 8px;
            margin: 0;
            font-family: 'Courier New', monospace;
          }
          .expiry {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .expiry p {
            margin: 0;
            color: #856404;
            font-size: 14px;
          }
          .footer {
            background: #f8f9fa;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
          }
          .footer p {
            color: #6c757d;
            font-size: 12px;
            margin: 5px 0;
          }
          .logo {
            font-size: 24px;
            margin-bottom: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🎵</div>
            <h1>ClefCloud</h1>
          </div>
          
          <div class="content">
            <h2>${template.title}</h2>
            <p>${template.message}</p>
            
            <div class="code-box">
              <p class="code">${code}</p>
            </div>
            
            <div class="expiry">
              <p>⏰ <strong>Ce code expire ${expiresIn}</strong></p>
            </div>
            
            <p style="color: #999; font-size: 14px;">
              Si vous n'avez pas demandé ce code, vous pouvez ignorer cet email en toute sécurité.
            </p>
          </div>
          
          <div class="footer">
            <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            <p>&copy; ${new Date().getFullYear()} ClefCloud. Tous droits réservés.</p>
            <p style="margin-top: 15px;">
              <a href="https://clefcloud.com" style="color: #8C48FF; text-decoration: none;">clefcloud.com</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    return {
      subject: template.subject,
      htmlBody,
    };
  }

  /**
   * Obtenir le texte d'expiration
   */
  private getExpirationText(expiresAt: Date): string {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours >= 24) {
      return 'dans 24 heures';
    } else if (hours > 0) {
      return `dans ${hours} heure${hours > 1 ? 's' : ''}`;
    } else {
      return `dans ${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
  }
}
