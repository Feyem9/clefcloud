import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { User } from './users/entities/user.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {
    this.fromEmail = this.configService.get('MAIL_FROM_EMAIL', 'pasyves43@gmail.com');
    this.fromName = this.configService.get('MAIL_FROM_NAME', 'ClefCloud');
    this.logger.log(`📧 Mail Service initialized using SMTP - From: ${this.fromName} <${this.fromEmail}>`);
  }

  async sendTestEmail(to: string) {
    this.logger.log(`Sending test email to ${to}`);
    try {
      await this.mailerService.sendMail({
        to,
        subject: 'Email de test depuis ClefCloud',
        text: 'Ceci est un e-mail de test.',
        html: '<b>Ceci est un e-mail de test.</b>',
      });
      this.logger.log(`Test email sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send test email to ${to}`, error.stack);
      throw error;
    }
  }

  async sendWelcomeEmail(user: User) {
    const { email, name } = user;
    this.logger.log(`Sending welcome email to ${email}`);
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Bienvenue sur ClefCloud !',
        template: './welcome', // Optionnel: si vous utilisez des templates
        context: { name: name || email }, // Optionnel: pour les templates
        html: `<b>Bienvenue ${name || email} !</b><p>Votre compte est maintenant actif.</p>`,
      });
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${email}`, error.stack);
    }
  }

  async sendVerificationEmail(email: string, code: string) {
    this.logger.log(`📧 Envoi du code de vérification à ${email} via Gmail SMTP`);

    try {
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #8C48FF;">Bienvenue sur ClefCloud !</h2>
          <p>Merci de vous être inscrit. Voici votre code de vérification :</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #8C48FF; margin: 20px 0;">
            ${code}
          </div>
          <p>Ce code expire dans 24 heures.</p>
          <p style="color: #666; font-size: 12px;">Si vous n'avez pas demandé ce code, ignorez cet email.</p>
        </div>
      `;

      await this.mailerService.sendMail({
        to: email,
        subject: '🎵 Bienvenue sur ClefCloud - Code de vérification',
        html: htmlBody,
        text: `Bienvenue sur ClefCloud ! Votre code de vérification est : ${code}. Ce code expire dans 24 heures.`,
      });

      this.logger.log(`✅ Code de vérification envoyé à ${email}`);
    } catch (error) {
      this.logger.error(`❌ Échec de l'envoi du code à ${email}`, error.stack);
      throw error;
    }
  }
}