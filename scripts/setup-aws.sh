#!/bin/bash

# Script de configuration initiale de l'infrastructure AWS avec Terraform

set -e

echo "🏗️  Configuration de l'infrastructure AWS pour ClefCloud"

# Vérifier que Terraform est installé
if ! command -v terraform &> /dev/null; then
    echo "❌ Terraform n'est pas installé"
    echo "Installez Terraform: https://www.terraform.io/downloads"
    exit 1
fi

# Vérifier que AWS CLI est installé
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI n'est pas installé"
    echo "Installez AWS CLI: https://aws.amazon.com/cli/"
    exit 1
fi

echo "✅ Prérequis vérifiés"

# Demander les informations
read -p "Environnement (dev/staging/prod) [dev]: " ENVIRONMENT
ENVIRONMENT=${ENVIRONMENT:-dev}

read -p "Région AWS [eu-west-1]: " AWS_REGION
AWS_REGION=${AWS_REGION:-eu-west-1}

read -p "Nom du projet [clefcloud]: " PROJECT_NAME
PROJECT_NAME=${PROJECT_NAME:-clefcloud}

read -sp "Mot de passe de la base de données: " DB_PASSWORD
echo

read -p "Username de la base de données [clefcloud_admin]: " DB_USERNAME
DB_USERNAME=${DB_USERNAME:-clefcloud_admin}

# Créer le fichier terraform.tfvars
cd terraform

cat > terraform.tfvars << EOF
aws_region   = "${AWS_REGION}"
environment  = "${ENVIRONMENT}"
project_name = "${PROJECT_NAME}"
vpc_cidr     = "10.0.0.0/16"
db_username  = "${DB_USERNAME}"
db_password  = "${DB_PASSWORD}"
EOF

echo "📝 Fichier terraform.tfvars créé"

# Initialiser Terraform
echo "🔧 Initialisation de Terraform..."
terraform init

# Valider la configuration
echo "✅ Validation de la configuration..."
terraform validate

# Planifier le déploiement
echo "📋 Planification du déploiement..."
terraform plan -out=tfplan

# Demander confirmation
read -p "Voulez-vous appliquer ces changements? (yes/no): " CONFIRM

if [ "$CONFIRM" = "yes" ]; then
    echo "🚀 Déploiement de l'infrastructure..."
    terraform apply tfplan
    
    echo ""
    echo "✅ Infrastructure déployée avec succès!"
    echo ""
    echo "📝 Informations importantes:"
    terraform output
    
    echo ""
    echo "⚠️  Sauvegardez ces informations dans votre fichier .env"
else
    echo "❌ Déploiement annulé"
    rm -f tfplan
fi
