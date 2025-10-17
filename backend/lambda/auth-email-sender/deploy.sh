#!/bin/bash

set -e

FUNCTION_NAME="AuthEmailSender"
ROLE_NAME="AuthEmailSenderRole"
REGION="us-east-1"
RUNTIME="nodejs22.x"
HANDLER="index.handler"
TIMEOUT=60
MEMORY=256

# Variables d'environnement
MAIL_USER="${MAIL_USER:-feyemlionel@gmail.com}"
MAIL_PASSWORD="${MAIL_PASSWORD:-lphsbuhtpfsqqwpk}"
RABBITMQ_BROKER_ID="${RABBITMQ_BROKER_ID:-b-aea6af65-515a-430f-a650-31aca074ee31}"

echo "🚀 Déploiement de la Lambda Auth Email Sender"

# Installer les dépendances
echo "📦 Installation des dépendances..."
npm install --production

# Créer le package
echo "📦 Création du package ZIP..."
rm -f function.zip
zip -r function.zip index.js node_modules package.json > /dev/null

# Vérifier si le rôle existe
ROLE_EXISTS=$(aws iam get-role --role-name $ROLE_NAME --region $REGION 2>&1 || true)

if echo "$ROLE_EXISTS" | grep -q "NoSuchEntity"; then
  echo "🆕 Création du rôle IAM..."
  
  # Créer le rôle
  aws iam create-role \
    --role-name $ROLE_NAME \
    --assume-role-policy-document '{
      "Version": "2012-10-17",
      "Statement": [{
        "Effect": "Allow",
        "Principal": {"Service": "lambda.amazonaws.com"},
        "Action": "sts:AssumeRole"
      }]
    }' \
    --region $REGION \
    > /dev/null
  
  # Attacher les politiques
  aws iam attach-role-policy \
    --role-name $ROLE_NAME \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole \
    --region $REGION
  
  aws iam attach-role-policy \
    --role-name $ROLE_NAME \
    --policy-arn arn:aws:iam::aws:policy/AmazonMQFullAccess \
    --region $REGION
  
  echo "✅ Rôle créé"
  sleep 10  # Attendre que le rôle soit propagé
fi

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
    --environment "Variables={MAIL_USER=$MAIL_USER,MAIL_PASSWORD=$MAIL_PASSWORD}" \
    --region $REGION \
    > /dev/null
  
  echo "✅ Lambda créée"
  
else
  echo "🔄 Mise à jour de la Lambda..."
  
  aws lambda update-function-code \
    --function-name $FUNCTION_NAME \
    --zip-file fileb://function.zip \
    --region $REGION \
    > /dev/null
  
  aws lambda update-function-configuration \
    --function-name $FUNCTION_NAME \
    --environment "Variables={MAIL_USER=$MAIL_USER,MAIL_PASSWORD=$MAIL_PASSWORD}" \
    --region $REGION \
    > /dev/null
  
  echo "✅ Lambda mise à jour"
fi

# Configurer le trigger RabbitMQ
echo "🔗 Configuration du trigger RabbitMQ..."

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
LAMBDA_ARN="arn:aws:lambda:$REGION:$ACCOUNT_ID:function:$FUNCTION_NAME"
BROKER_ARN="arn:aws:mq:$REGION:$ACCOUNT_ID:broker:$RABBITMQ_BROKER_ID"

# Créer le secret pour les credentials RabbitMQ
SECRET_NAME="rabbitmq-credentials"
SECRET_EXISTS=$(aws secretsmanager describe-secret --secret-id $SECRET_NAME --region $REGION 2>&1 || true)

if echo "$SECRET_EXISTS" | grep -q "ResourceNotFoundException"; then
  echo "🔐 Création du secret RabbitMQ..."
  aws secretsmanager create-secret \
    --name $SECRET_NAME \
    --secret-string '{"username":"admin","password":"ClefCloud2025!"}' \
    --region $REGION \
    > /dev/null
fi

SECRET_ARN=$(aws secretsmanager describe-secret --secret-id $SECRET_NAME --region $REGION --query 'ARN' --output text)

# Créer l'event source mapping
echo "🔗 Création du trigger RabbitMQ..."
aws lambda create-event-source-mapping \
  --function-name $FUNCTION_NAME \
  --batch-size 10 \
  --source-access-configuration Type=BASIC_AUTH,URI=$SECRET_ARN \
  --event-source-arn $BROKER_ARN \
  --queues "auth-verification-codes" \
  --region $REGION \
  2>&1 | grep -v "ResourceConflictException" || true

echo "✅ Trigger configuré"

# Nettoyer
rm -f function.zip

echo "✅ Déploiement terminé !"
echo ""
echo "📝 Pour tester:"
echo "   1. Le backend publie dans RabbitMQ"
echo "   2. La Lambda consomme automatiquement"
echo "   3. L'email est envoyé via Gmail SMTP"
