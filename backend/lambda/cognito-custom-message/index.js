/**
 * AWS Lambda - Cognito Custom Message Trigger
 * 
 * Intercepte les codes de vérification Cognito et les envoie à RabbitMQ
 * pour traitement asynchrone par le backend NestJS
 */

const amqp = require('amqplib');
const AWS = require('aws-sdk');

const cloudwatch = new AWS.CloudWatchLogs({ region: process.env.AWS_REGION || 'us-east-1' });

// Configuration RabbitMQ
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const QUEUE_NAME = 'cognito-verification-codes';

/**
 * Handler principal
 */
exports.handler = async (event, context) => {
  const startTime = Date.now();
  
  console.log('📧 [Lambda] Cognito Custom Message Trigger');
  console.log('📦 Event:', JSON.stringify(event, null, 2));

  try {
    // Extraire les données importantes
    const {
      userName,
      userPoolId,
      triggerSource,
      request: {
        userAttributes,
        codeParameter,
        linkParameter
      }
    } = event;

    const verificationData = {
      // Identifiants
      userId: userName,
      userPoolId,
      email: userAttributes.email,
      phoneNumber: userAttributes.phone_number,
      
      // Code de vérification ⭐
      verificationCode: codeParameter,
      verificationLink: linkParameter,
      
      // Type d'événement
      triggerSource,
      eventType: getTriggerType(triggerSource),
      
      // Métadonnées
      timestamp: new Date().toISOString(),
      lambdaRequestId: context.requestId,
      userAttributes: {
        sub: userAttributes.sub,
        emailVerified: userAttributes.email_verified === 'true',
        phoneVerified: userAttributes.phone_number_verified === 'true',
        userStatus: userAttributes['cognito:user_status']
      }
    };

    console.log('🔑 Code intercepté:', verificationData.verificationCode);
    console.log('📧 Email:', verificationData.email);
    console.log('🎯 Type:', verificationData.eventType);

    // Envoyer à RabbitMQ pour traitement asynchrone
    await sendToQueue(verificationData);

    // Logger dans CloudWatch
    await logToCloudWatch(verificationData);

    // Personnaliser le message (optionnel)
    event.response = customizeMessage(event, verificationData);

    const duration = Date.now() - startTime;
    console.log(`✅ [Lambda] Traitement terminé en ${duration}ms`);

    return event;

  } catch (error) {
    console.error('❌ [Lambda] Erreur:', error);
    
    // Logger l'erreur dans CloudWatch
    await logError(error, event);

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
    console.log('📨 [RabbitMQ] Connexion...');
    
    // Connexion à RabbitMQ
    connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();

    // Créer la queue si elle n'existe pas
    await channel.assertQueue(QUEUE_NAME, {
      durable: true, // Persiste après redémarrage
      arguments: {
        'x-message-ttl': 3600000, // TTL 1 heure
        'x-max-length': 10000 // Max 10k messages
      }
    });

    // Publier le message
    const message = Buffer.from(JSON.stringify(data));
    channel.sendToQueue(QUEUE_NAME, message, {
      persistent: true,
      contentType: 'application/json',
      timestamp: Date.now(),
      headers: {
        'x-source': 'cognito-lambda',
        'x-event-type': data.eventType
      }
    });

    console.log(`✅ [RabbitMQ] Message envoyé à la queue: ${QUEUE_NAME}`);

    // Fermer proprement
    await channel.close();
    await connection.close();

  } catch (error) {
    console.error('❌ [RabbitMQ] Erreur:', error);
    
    // Fermer les connexions en cas d'erreur
    if (channel) await channel.close().catch(() => {});
    if (connection) await connection.close().catch(() => {});
    
    throw error;
  }
}

/**
 * Logger dans CloudWatch Logs
 */
async function logToCloudWatch(data) {
  try {
    const logGroupName = '/aws/lambda/cognito-verification-codes';
    const logStreamName = `${data.eventType}-${new Date().toISOString().split('T')[0]}`;

    // Créer le log stream s'il n'existe pas
    try {
      await cloudwatch.createLogStream({
        logGroupName,
        logStreamName
      }).promise();
    } catch (err) {
      // Le stream existe déjà
      if (err.code !== 'ResourceAlreadyExistsException') {
        throw err;
      }
    }

    // Écrire le log
    await cloudwatch.putLogEvents({
      logGroupName,
      logStreamName,
      logEvents: [{
        timestamp: Date.now(),
        message: JSON.stringify({
          level: 'INFO',
          event: 'VERIFICATION_CODE_INTERCEPTED',
          data: {
            email: data.email,
            code: data.verificationCode,
            type: data.eventType,
            timestamp: data.timestamp,
            userId: data.userId
          }
        })
      }]
    }).promise();

    console.log('✅ [CloudWatch] Log enregistré');

  } catch (error) {
    console.error('❌ [CloudWatch] Erreur:', error);
    // Ne pas bloquer si CloudWatch échoue
  }
}

/**
 * Logger les erreurs
 */
async function logError(error, event) {
  try {
    const logGroupName = '/aws/lambda/cognito-verification-codes';
    const logStreamName = `errors-${new Date().toISOString().split('T')[0]}`;

    await cloudwatch.createLogStream({
      logGroupName,
      logStreamName
    }).promise().catch(() => {});

    await cloudwatch.putLogEvents({
      logGroupName,
      logStreamName,
      logEvents: [{
        timestamp: Date.now(),
        message: JSON.stringify({
          level: 'ERROR',
          event: 'LAMBDA_ERROR',
          error: {
            message: error.message,
            stack: error.stack,
            event: event
          }
        })
      }]
    }).promise();

  } catch (err) {
    console.error('❌ [CloudWatch] Impossible de logger l\'erreur:', err);
  }
}

/**
 * Déterminer le type d'événement
 */
function getTriggerType(triggerSource) {
  const types = {
    'CustomMessage_SignUp': 'SIGNUP',
    'CustomMessage_ForgotPassword': 'FORGOT_PASSWORD',
    'CustomMessage_ResendCode': 'RESEND_CODE',
    'CustomMessage_VerifyUserAttribute': 'VERIFY_ATTRIBUTE',
    'CustomMessage_UpdateUserAttribute': 'UPDATE_ATTRIBUTE',
    'CustomMessage_Authentication': 'AUTHENTICATION'
  };

  return types[triggerSource] || 'UNKNOWN';
}

/**
 * Personnaliser le message Cognito (optionnel)
 */
function customizeMessage(event, data) {
  const { eventType, verificationCode } = data;

  // Messages personnalisés
  const messages = {
    SIGNUP: {
      subject: '🎵 Bienvenue sur ClefCloud !',
      message: `Votre code de vérification est : ${verificationCode}\n\nCe code expire dans 24 heures.`
    },
    FORGOT_PASSWORD: {
      subject: '🔑 Réinitialisation de votre mot de passe',
      message: `Votre code de réinitialisation est : ${verificationCode}\n\nCe code expire dans 1 heure.`
    },
    RESEND_CODE: {
      subject: '🔄 Nouveau code de vérification',
      message: `Votre nouveau code est : ${verificationCode}`
    }
  };

  const customMessage = messages[eventType] || {
    subject: 'Code de vérification',
    message: `Votre code est : ${verificationCode}`
  };

  return {
    emailSubject: customMessage.subject,
    emailMessage: customMessage.message,
    smsMessage: `ClefCloud: Votre code est ${verificationCode}`
  };
}
