/**
 * Test local de la Lambda function
 * Usage: node test-local.js
 */

require('dotenv').config();

// Mock de l'événement Cognito
const mockEvents = {
  signup: {
    version: '1',
    region: 'us-east-1',
    userPoolId: 'us-east-1_dl0kSgKUl',
    userName: 'test-user-uuid-123',
    callerContext: {
      awsSdkVersion: '2.1500.0',
      clientId: '2pu1v5mpa5eht36m8im2ns40sf'
    },
    triggerSource: 'CustomMessage_SignUp',
    request: {
      userAttributes: {
        sub: 'test-user-uuid-123',
        'cognito:email_alias': 'feyemlionel@gmail.com',
        'cognito:user_status': 'UNCONFIRMED',
        email_verified: 'false',
        phone_number_verified: 'false',
        email: 'feyemlionel@gmail.com',
        phone_number: '+237683845543'
      },
      codeParameter: '123456', // ⭐ Le code de vérification !
      linkParameter: null,
      usernameParameter: null
    },
    response: {
      smsMessage: null,
      emailMessage: null,
      emailSubject: null
    }
  },
  
  forgotPassword: {
    version: '1',
    region: 'us-east-1',
    userPoolId: 'us-east-1_dl0kSgKUl',
    userName: 'test-user-uuid-123',
    callerContext: {
      awsSdkVersion: '2.1500.0',
      clientId: '2pu1v5mpa5eht36m8im2ns40sf'
    },
    triggerSource: 'CustomMessage_ForgotPassword',
    request: {
      userAttributes: {
        sub: 'test-user-uuid-123',
        email_verified: 'true',
        phone_number_verified: 'false',
        email: 'feyemlionel@gmail.com',
        phone_number: '+237683845543'
      },
      codeParameter: '789012', // ⭐ Le code de réinitialisation !
      linkParameter: null,
      usernameParameter: null
    },
    response: {
      smsMessage: null,
      emailMessage: null,
      emailSubject: null
    }
  }
};

// Mock du contexte Lambda
const mockContext = {
  requestId: 'test-request-id-' + Date.now(),
  functionName: 'CognitoCustomMessage',
  functionVersion: '$LATEST',
  invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789:function:CognitoCustomMessage',
  memoryLimitInMB: '256',
  awsRequestId: 'test-aws-request-id',
  logGroupName: '/aws/lambda/CognitoCustomMessage',
  logStreamName: '2025/01/16/[$LATEST]test',
};

// Charger les variables d'environnement
process.env.AWS_REGION = process.env.AWS_REGION || 'us-east-1';
process.env.RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';

// Importer la fonction Lambda
const { handler } = require('./index');

// Fonction de test
async function test() {
  console.log('🧪 Test de la Lambda Cognito Custom Message\n');
  console.log('=' .repeat(60));
  
  // Test 1: Signup
  console.log('\n📝 Test 1: SIGNUP');
  console.log('-'.repeat(60));
  try {
    const result1 = await handler(mockEvents.signup, mockContext);
    console.log('✅ Test SIGNUP réussi');
    console.log('📧 Subject:', result1.response.emailSubject);
    console.log('📨 Message preview:', result1.response.emailMessage.substring(0, 100) + '...');
  } catch (error) {
    console.error('❌ Test SIGNUP échoué:', error.message);
  }
  
  // Attendre 2 secondes
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 2: Forgot Password
  console.log('\n🔑 Test 2: FORGOT PASSWORD');
  console.log('-'.repeat(60));
  try {
    const result2 = await handler(mockEvents.forgotPassword, mockContext);
    console.log('✅ Test FORGOT PASSWORD réussi');
    console.log('📧 Subject:', result2.response.emailSubject);
    console.log('📨 Message preview:', result2.response.emailMessage.substring(0, 100) + '...');
  } catch (error) {
    console.error('❌ Test FORGOT PASSWORD échoué:', error.message);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Tests terminés\n');
  
  console.log('📊 Vérifications:');
  console.log('  1. Vérifiez RabbitMQ: http://localhost:15672');
  console.log('  2. Vérifiez la queue: cognito-verification-codes');
  console.log('  3. Vérifiez les logs CloudWatch (si configuré)');
  console.log('  4. Vérifiez PostgreSQL: SELECT * FROM verification_codes;');
  
  // Fermer proprement
  process.exit(0);
}

// Exécuter les tests
test().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
