/**
 * Script de test pour vérifier l'envoi d'emails via Cognito
 * Usage: node test-email.js
 */

require('dotenv').config();
const { CognitoIdentityProviderClient, ForgotPasswordCommand } = require('@aws-sdk/client-cognito-identity-provider');

const client = new CognitoIdentityProviderClient({
  region: process.env.COGNITO_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function testForgotPassword() {
  const email = 'feyemlionel@gmail.com'; // Changez avec votre email

  console.log('🔍 Test d\'envoi d\'email via Cognito...');
  console.log('📧 Email:', email);
  console.log('🌍 Région:', process.env.COGNITO_REGION);
  console.log('🔑 User Pool ID:', process.env.COGNITO_USER_POOL_ID);
  console.log('');

  try {
    const command = new ForgotPasswordCommand({
      ClientId: process.env.COGNITO_CLIENT_ID,
      Username: email,
    });

    const response = await client.send(command);
    
    console.log('✅ Succès ! Email envoyé');
    console.log('📦 Réponse:', JSON.stringify(response, null, 2));
    console.log('');
    console.log('⚠️  Vérifiez :');
    console.log('   1. Votre boîte de réception');
    console.log('   2. Votre dossier spam/courrier indésirable');
    console.log('   3. Que votre email est vérifié dans AWS SES (si en mode Sandbox)');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('');
    
    if (error.name === 'UserNotFoundException') {
      console.log('💡 Solution: L\'utilisateur n\'existe pas dans Cognito');
    } else if (error.name === 'LimitExceededException') {
      console.log('💡 Solution: Trop de tentatives. Attendez quelques minutes.');
    } else if (error.message.includes('email')) {
      console.log('💡 Solution: Vérifiez que votre email est vérifié dans AWS SES');
      console.log('   👉 https://console.aws.amazon.com/ses/');
    }
  }
}

testForgotPassword();
