/**
 * AWS Lambda - Cognito Post Confirmation Trigger
 * 
 * Appelée après qu'un utilisateur confirme son inscription
 * Envoie les données à RabbitMQ pour traitement par le backend
 */

const amqp = require('amqplib');

// Configuration RabbitMQ
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const QUEUE_NAME = 'cognito-user-events';

/**
 * Handler principal
 */
exports.handler = async (event, context) => {
  console.log('✅ [Lambda] Post Confirmation Trigger');
  console.log('📦 Event:', JSON.stringify(event, null, 2));

  try {
    const {
      userName,
      userPoolId,
      triggerSource,
      request: { userAttributes }
    } = event;

    const userData = {
      // Identifiants
      userId: userName,
      userPoolId,
      email: userAttributes.email,
      phoneNumber: userAttributes.phone_number,
      
      // Attributs utilisateur
      emailVerified: userAttributes.email_verified === 'true',
      phoneVerified: userAttributes.phone_number_verified === 'true',
      sub: userAttributes.sub,
      
      // Type d'événement
      triggerSource,
      eventType: 'USER_CONFIRMED',
      
      // Métadonnées
      timestamp: new Date().toISOString(),
      lambdaRequestId: context.requestId
    };

    console.log('👤 Utilisateur confirmé:', userData.email);

    // Envoyer à RabbitMQ
    await sendToQueue(userData);

    console.log('✅ [Lambda] Traitement terminé');
    return event;

  } catch (error) {
    console.error('❌ [Lambda] Erreur:', error);
    // Ne pas bloquer le processus Cognito
    return event;
  }
};

/**
 * Envoyer les données à RabbitMQ
 */
async function sendToQueue(data) {
  let connection;
  let channel;

  try {
    console.log('📨 [RabbitMQ] Connexion à:', RABBITMQ_URL.replace(/\/\/.*@/, '//***@'));
    
    connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();

    // Créer la queue si elle n'existe pas
    await channel.assertQueue(QUEUE_NAME, {
      durable: true,
      arguments: {
        'x-message-ttl': 3600000,
        'x-max-length': 10000
      }
    });

    // Publier le message
    const message = Buffer.from(JSON.stringify(data));
    channel.sendToQueue(QUEUE_NAME, message, {
      persistent: true,
      contentType: 'application/json',
      timestamp: Date.now()
    });

    console.log(`✅ [RabbitMQ] Message envoyé à: ${QUEUE_NAME}`);

    await channel.close();
    await connection.close();

  } catch (error) {
    console.error('❌ [RabbitMQ] Erreur:', error);
    
    if (channel) await channel.close().catch(() => {});
    if (connection) await connection.close().catch(() => {});
    
    throw error;
  }
}
