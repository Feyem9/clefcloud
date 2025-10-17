#!/bin/bash

# Script pour activer USER_PASSWORD_AUTH dans Cognito App Client
# Usage: ./enable-user-password-auth.sh

# Charger les variables d'environnement
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
else
  echo "❌ Fichier .env non trouvé"
  exit 1
fi

USER_POOL_ID="${COGNITO_USER_POOL_ID}"
CLIENT_ID="${COGNITO_CLIENT_ID}"
REGION="${COGNITO_REGION:-us-east-1}"

echo "🔧 Configuration de l'App Client Cognito"
echo "=========================================="
echo "User Pool ID: $USER_POOL_ID"
echo "Client ID: $CLIENT_ID"
echo "Region: $REGION"
echo ""

# Récupérer la configuration actuelle de l'app client
echo "📋 Récupération de la configuration actuelle..."
APP_CLIENT_CONFIG=$(aws cognito-idp describe-user-pool-client \
  --user-pool-id "$USER_POOL_ID" \
  --client-id "$CLIENT_ID" \
  --region "$REGION" 2>&1)

if [ $? -ne 0 ]; then
  echo "❌ Erreur lors de la récupération de la configuration:"
  echo "$APP_CLIENT_CONFIG"
  exit 1
fi

echo "✅ Configuration récupérée"
echo ""

# Mettre à jour l'app client pour activer USER_PASSWORD_AUTH
echo "🔄 Activation de USER_PASSWORD_AUTH..."

aws cognito-idp update-user-pool-client \
  --user-pool-id "$USER_POOL_ID" \
  --client-id "$CLIENT_ID" \
  --region "$REGION" \
  --explicit-auth-flows \
    ALLOW_USER_PASSWORD_AUTH \
    ALLOW_REFRESH_TOKEN_AUTH \
    ALLOW_USER_SRP_AUTH

if [ $? -eq 0 ]; then
  echo "✅ USER_PASSWORD_AUTH activé avec succès!"
  echo ""
  echo "Les flux d'authentification suivants sont maintenant activés:"
  echo "  ✅ ALLOW_USER_PASSWORD_AUTH"
  echo "  ✅ ALLOW_REFRESH_TOKEN_AUTH"
  echo "  ✅ ALLOW_USER_SRP_AUTH"
  echo ""
  echo "🎉 Vous pouvez maintenant tester la connexion!"
else
  echo "❌ Erreur lors de l'activation de USER_PASSWORD_AUTH"
  exit 1
fi
