#!/bin/bash

# Script de déploiement automatique de la Lambda Cognito Custom Message
# Usage: ./deploy.sh [create|update]

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FUNCTION_NAME="CognitoCustomMessage"
ROLE_NAME="CognitoCustomMessageRole"
REGION="us-east-1"
USER_POOL_ID="us-east-1_dl0kSgKUl"
RUNTIME="nodejs18.x"
HANDLER="index.handler"
TIMEOUT=30
MEMORY=256

# Variables d'environnement (à personnaliser)
RABBITMQ_URL="${RABBITMQ_URL:-amqps://admin:ClefCloud2025!@b-aea6af65-515a-430f-a650-31aca074ee31.mq.us-east-1.on.aws:5671}"

echo -e "${BLUE}🚀 Déploiement de la Lambda Cognito Custom Message${NC}\n"

# Fonction pour afficher les erreurs
error_exit() {
    echo -e "${RED}❌ Erreur: $1${NC}" 1>&2
    exit 1
}

# Vérifier les prérequis
echo -e "${YELLOW}📋 Vérification des prérequis...${NC}"

if ! command -v aws &> /dev/null; then
    error_exit "AWS CLI n'est pas installé"
fi

if ! command -v npm &> /dev/null; then
    error_exit "npm n'est pas installé"
fi

if ! command -v zip &> /dev/null; then
    error_exit "zip n'est pas installé"
fi

echo -e "${GREEN}✅ Prérequis OK${NC}\n"

# Déterminer l'action (create ou update)
ACTION="${1:-update}"

if [[ "$ACTION" != "create" && "$ACTION" != "update" ]]; then
    error_exit "Action invalide. Utilisez 'create' ou 'update'"
fi

# Installer les dépendances
echo -e "${YELLOW}📦 Installation des dépendances...${NC}"
npm install --production || error_exit "Échec de l'installation des dépendances"
echo -e "${GREEN}✅ Dépendances installées${NC}\n"

# Créer le package
echo -e "${YELLOW}📦 Création du package ZIP...${NC}"
rm -f function.zip
zip -r function.zip index.js node_modules package.json > /dev/null || error_exit "Échec de la création du ZIP"
echo -e "${GREEN}✅ Package créé: $(du -h function.zip | cut -f1)${NC}\n"

if [[ "$ACTION" == "create" ]]; then
    echo -e "${BLUE}🆕 Création de la Lambda function...${NC}\n"
    
    # Créer le rôle IAM
    echo -e "${YELLOW}👤 Création du rôle IAM...${NC}"
    
    ROLE_ARN=$(aws iam get-role --role-name $ROLE_NAME --query 'Role.Arn' --output text 2>/dev/null || true)
    
    if [[ -z "$ROLE_ARN" ]]; then
        aws iam create-role \
            --role-name $ROLE_NAME \
            --assume-role-policy-document '{
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }' > /dev/null || error_exit "Échec de la création du rôle"
        
        echo -e "${GREEN}✅ Rôle IAM créé${NC}"
        
        # Attacher les politiques
        echo -e "${YELLOW}🔐 Attachement des politiques...${NC}"
        
        aws iam attach-role-policy \
            --role-name $ROLE_NAME \
            --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
        
        aws iam attach-role-policy \
            --role-name $ROLE_NAME \
            --policy-arn arn:aws:iam::aws:policy/CloudWatchLogsFullAccess
        
        echo -e "${GREEN}✅ Politiques attachées${NC}"
        
        # Attendre que le rôle soit prêt
        echo -e "${YELLOW}⏳ Attente de la propagation du rôle (10s)...${NC}"
        sleep 10
        
        ROLE_ARN=$(aws iam get-role --role-name $ROLE_NAME --query 'Role.Arn' --output text)
    else
        echo -e "${GREEN}✅ Rôle IAM existe déjà${NC}"
    fi
    
    # Créer la Lambda
    echo -e "${YELLOW}⚡ Création de la fonction Lambda...${NC}"
    
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
        --cli-connect-timeout 60 \
        --cli-read-timeout 60 \
        > /dev/null || error_exit "Échec de la création de la Lambda"
    
    echo -e "${GREEN}✅ Lambda créée${NC}\n"
    
    # Donner les permissions à Cognito
    echo -e "${YELLOW}🔐 Configuration des permissions Cognito...${NC}"
    
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    
    aws lambda add-permission \
        --function-name $FUNCTION_NAME \
        --statement-id CognitoInvoke \
        --action lambda:InvokeFunction \
        --principal cognito-idp.amazonaws.com \
        --source-arn "arn:aws:cognito-idp:$REGION:$ACCOUNT_ID:userpool/$USER_POOL_ID" \
        --region $REGION \
        > /dev/null || echo -e "${YELLOW}⚠️  Permission déjà existante${NC}"
    
    echo -e "${GREEN}✅ Permissions configurées${NC}\n"
    
    # Configurer le trigger Cognito
    echo -e "${YELLOW}🔗 Configuration du trigger Cognito...${NC}"
    
    LAMBDA_ARN="arn:aws:lambda:$REGION:$ACCOUNT_ID:function:$FUNCTION_NAME"
    
    aws cognito-idp update-user-pool \
        --user-pool-id $USER_POOL_ID \
        --lambda-config "CustomMessage=$LAMBDA_ARN" \
        --region $REGION \
        > /dev/null || error_exit "Échec de la configuration du trigger"
    
    echo -e "${GREEN}✅ Trigger Cognito configuré${NC}\n"
    
else
    # Mise à jour
    echo -e "${BLUE}🔄 Mise à jour de la Lambda function...${NC}\n"
    
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://function.zip \
        --region $REGION \
        > /dev/null || error_exit "Échec de la mise à jour"
    
    echo -e "${GREEN}✅ Code mis à jour${NC}\n"
    
    # Mettre à jour les variables d'environnement
    echo -e "${YELLOW}🔧 Mise à jour des variables d'environnement...${NC}"
    
    aws lambda update-function-configuration \
        --function-name $FUNCTION_NAME \
        --environment "Variables={RABBITMQ_URL=$RABBITMQ_URL}" \
        --region $REGION \
        > /dev/null || error_exit "Échec de la mise à jour de la configuration"
    
    echo -e "${GREEN}✅ Configuration mise à jour${NC}\n"
fi

# Afficher les informations
echo -e "${BLUE}📊 Informations de la Lambda:${NC}"
aws lambda get-function --function-name $FUNCTION_NAME --region $REGION --query 'Configuration.[FunctionName,Runtime,Handler,Timeout,MemorySize,LastModified]' --output table

echo -e "\n${GREEN}✅ Déploiement terminé avec succès !${NC}\n"

echo -e "${BLUE}📝 Prochaines étapes:${NC}"
echo -e "  1. Testez la Lambda: aws lambda invoke --function-name $FUNCTION_NAME output.json"
echo -e "  2. Vérifiez les logs: aws logs tail /aws/lambda/$FUNCTION_NAME --follow"
echo -e "  3. Testez avec Cognito: Créez un compte sur votre application"
echo -e "  4. Vérifiez RabbitMQ: http://localhost:15672"
echo -e "  5. Vérifiez PostgreSQL: SELECT * FROM verification_codes;\n"

# Nettoyer
rm -f function.zip

exit 0
