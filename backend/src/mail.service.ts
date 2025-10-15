import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { User } from './users/entities/user.entity';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) {}

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
}