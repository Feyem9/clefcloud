/**
 * AWS Lambda - Auth Email Sender
 * 
 * Consomme les messages de la queue RabbitMQ et envoie les emails de vérification
 */

const nodemailer = require('nodemailer');

// Configuration Gmail SMTP
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

/**
 * Handler principal
 */
exports.handler = async (event) => {
  console.log('📧 [Lambda] Auth Email Sender triggered');
  console.log('📦 Event:', JSON.stringify(event, null, 2));

  const results = [];

  // Traiter chaque message de la queue
  for (const record of event.rmqMessagesByQueue['auth-verification-codes'] || []) {
    try {
      const message = JSON.parse(record.data);
      console.log('📨 Message reçu:', message);

      await sendVerificationEmail(message);
      
      results.push({
        messageId: record.messageId,
        status: 'success',
      });
    } catch (error) {
      console.error('❌ Erreur lors du traitement du message:', error);
      results.push({
        messageId: record.messageId,
        status: 'error',
        error: error.message,
      });
    }
  }

  console.log('✅ Traitement terminé:', results);
  return {
    statusCode: 200,
    body: JSON.stringify(results),
  };
};

/**
 * Envoyer l'email de vérification
 */
async function sendVerificationEmail(data) {
  const { email, code, eventType } = data;

  console.log(`📧 Envoi de l'email à ${email}`);

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

  const mailOptions = {
    from: `"ClefCloud" <${process.env.MAIL_USER}>`,
    to: email,
    subject: '🎵 Bienvenue sur ClefCloud - Code de vérification',
    html: htmlBody,
    text: `Bienvenue sur ClefCloud ! Votre code de vérification est : ${code}. Ce code expire dans 24 heures.`,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`✅ Email envoyé: ${info.messageId}`);

  return info;
}
