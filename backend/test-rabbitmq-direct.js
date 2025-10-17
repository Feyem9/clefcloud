#!/usr/bin/env node

/**
 * Script de test pour envoyer un message directement à RabbitMQ
 * Simule ce que la Lambda ferait
 */

const amqp = require('amqplib');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const QUEUE_NAME = 'cognito-verification-codes';

async function sendTestMessage() {
  let connection;
  let channel;

  try {
    console.log('🐰 Connexion à RabbitMQ:', RABBITMQ_URL);
    connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();

    console.log('📦 Vérification de la queue:', QUEUE_NAME);
    // On utilise checkQueue au lieu de assertQueue pour ne pas modifier la queue existante
    await channel.checkQueue(QUEUE_NAME);

    const testMessage = {
      email: 'christian.test@clefcloud.com',
      verificationCode: '789456',
      eventType: 'SIGNUP',
      firstName: 'Christian',
      lastName: 'Test',
      userPoolId: 'us-east-1_dl0kSgKUl',
      userName: 'christian-test-' + Date.now(),
      timestamp: new Date().toISOString(),
    };

    console.log('📨 Envoi du message de test...');
    console.log('   Email:', testMessage.email);
    console.log('   Code:', testMessage.verificationCode);
    console.log('   Type:', testMessage.eventType);
    
    const sent = channel.sendToQueue(
      QUEUE_NAME,
      Buffer.from(JSON.stringify(testMessage)),
      { persistent: true }
    );

    if (sent) {
      console.log('✅ Message envoyé avec succès !');
      console.log('');
      console.log('🔍 Vérifications:');
      console.log('  1. RabbitMQ UI: http://localhost:15672');
      console.log('  2. Logs backend: Vérifier la console npm');
      console.log('  3. PostgreSQL: Vérifier la table verification_codes');
      console.log('');
      console.log('⏳ Le backend va traiter le message dans quelques secondes...');
    } else {
      console.log('⚠️  Le message n\'a pas pu être envoyé (buffer plein)');
    }

    // Attendre un peu avant de fermer
    await new Promise(resolve => setTimeout(resolve, 1000));

    await channel.close();
    await connection.close();
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.code === 404) {
      console.error('   La queue n\'existe pas. Le backend doit être démarré d\'abord.');
    }
    try {
      if (channel) await channel.close();
      if (connection) await connection.close();
    } catch (e) {
      // Ignore
    }
    process.exit(1);
  }
}

console.log('');
console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║  🧪 Test RabbitMQ - Envoi d\'un code de vérification     ║');
console.log('╚═══════════════════════════════════════════════════════════╝');
console.log('');

sendTestMessage();
