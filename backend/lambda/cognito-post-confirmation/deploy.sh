#!/bin/bash

set -e

FUNCTION_NAME="CognitoPostConfirmation"
ROLE_NAME="CognitoCustomMessageRole"  # Réutiliser le même rôle
REGION="us-east-1"
USER_POOL_ID="us-east-1_dl0kSgKUl"
RUNTIME="nodejs22.x"
HANDLER="index.handler"
TIMEOUT=30
MEMORY=256

RABBITMQ_URL="${RABBITMQ_URL:-amqps://admin:ClefCloud2025!@b-aea6af65-515a-430f-a650-31aca074ee31.mq.us-east-1.on.aws:5671}"

echo "🚀 Déploiement de la Lambda Post Confirmation"

# Installer les dépendances
echo "📦 Installation des dépendances..."
npm install --production

# Créer le package
echo "📦 Création du package ZIP..."
rm -f function.zip
zip -r function.zip index.js node_modules package.json > /dev/null

# Vérifier si la fonction existe
FUNCTION_EXISTS=$(aws lambda get-function --function-name $FUNCTION_NAME --region $REGION 2>&1 || true)

if echo "$FUNCTION_EXISTS" | grep -q "ResourceNotFoundException"; then
  echo "🆕 Création de la Lambda..."
  
  ROLE_ARN=$(aws iam get-role --role-name $ROLE_NAME --query 'Role.Arn' --output text)
  
  aws lambda create-function \
    --function-name $FUNCTION_NAME \
    --runtime $RUNTIME \
    --role $ROLE_ARN \
    --handler $HANDLER \
    --zip-file fileb://function.zip \
    --timeout $TIMEOUT \
    --memory-size $MEMORY \
    --environment "Variables={RABBITMQ_URL=$RABBITMQ_URL}" \
    --region $REGION \
    > /dev/null
  
  echo "✅ Lambda créée"
  
  # Donner les permissions à Cognito
  ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
  
  aws lambda add-permission \
    --function-name $FUNCTION_NAME \
    --statement-id CognitoInvoke \
    --action lambda:InvokeFunction \
    --principal cognito-idp.amazonaws.com \
    --source-arn "arn:aws:cognito-idp:$REGION:$ACCOUNT_ID:userpool/$USER_POOL_ID" \
    --region $REGION \
    > /dev/null || true
  
  echo "✅ Permissions configurées"
  
else
  echo "🔄 Mise à jour de la Lambda..."
  
  aws lambda update-function-code \
    --function-name $FUNCTION_NAME \
    --zip-file fileb://function.zip \
    --region $REGION \
    > /dev/null
  
  aws lambda update-function-configuration \
    --function-name $FUNCTION_NAME \
    --environment "Variables={RABBITMQ_URL=$RABBITMQ_URL}" \
    --region $REGION \
    > /dev/null
  
  echo "✅ Lambda mise à jour"
fi

# Configurer le trigger Cognito
echo "🔗 Configuration du trigger Cognito..."

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
LAMBDA_ARN="arn:aws:lambda:$REGION:$ACCOUNT_ID:function:$FUNCTION_NAME"

aws cognito-idp update-user-pool \
  --user-pool-id $USER_POOL_ID \
  --lambda-config "PostConfirmation=$LAMBDA_ARN" \
  --region $REGION \
  > /dev/null

echo "✅ Trigger configuré"

# Nettoyer
rm -f function.zip

echo "✅ Déploiement terminé !"
