#!/bin/bash

# Script d'installation automatique du système de vérification Cognito
# Usage: ./install-verification-system.sh

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

clear

echo -e "${CYAN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🔐  Système de Vérification Cognito - Installation         ║
║                                                               ║
║   Lambda + RabbitMQ + NestJS + PostgreSQL + SES              ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}\n"

# Fonction pour afficher les erreurs
error_exit() {
    echo -e "${RED}❌ Erreur: $1${NC}" 1>&2
    exit 1
}

# Fonction pour afficher les succès
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Fonction pour afficher les infos
info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Fonction pour afficher les warnings
warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Vérifier les prérequis
echo -e "${MAGENTA}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${MAGENTA}  Étape 1/6 : Vérification des prérequis${NC}"
echo -e "${MAGENTA}═══════════════════════════════════════════════════════════════${NC}\n"

info "Vérification de Node.js..."
if ! command -v node &> /dev/null; then
    error_exit "Node.js n'est pas installé. Installez-le depuis https://nodejs.org/"
fi
NODE_VERSION=$(node -v)
success "Node.js installé: $NODE_VERSION"

info "Vérification de npm..."
if ! command -v npm &> /dev/null; then
    error_exit "npm n'est pas installé"
fi
NPM_VERSION=$(npm -v)
success "npm installé: $NPM_VERSION"

info "Vérification de Docker..."
if ! command -v docker &> /dev/null; then
    warning "Docker n'est pas installé. RabbitMQ devra être installé manuellement."
    DOCKER_AVAILABLE=false
else
    DOCKER_VERSION=$(docker --version)
    success "Docker installé: $DOCKER_VERSION"
    DOCKER_AVAILABLE=true
fi

info "Vérification de AWS CLI..."
if ! command -v aws &> /dev/null; then
    warning "AWS CLI n'est pas installé. Le déploiement Lambda devra être fait manuellement."
    AWS_AVAILABLE=false
else
    AWS_VERSION=$(aws --version)
    success "AWS CLI installé: $AWS_VERSION"
    AWS_AVAILABLE=true
fi

info "Vérification de psql..."
if ! command -v psql &> /dev/null; then
    warning "psql n'est pas installé. La migration PostgreSQL devra être faite manuellement."
    PSQL_AVAILABLE=false
else
    PSQL_VERSION=$(psql --version)
    success "psql installé: $PSQL_VERSION"
    PSQL_AVAILABLE=true
fi

echo ""

# Installation des dépendances Backend
echo -e "${MAGENTA}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${MAGENTA}  Étape 2/6 : Installation des dépendances Backend${NC}"
echo -e "${MAGENTA}═══════════════════════════════════════════════════════════════${NC}\n"

info "Installation des dépendances NestJS..."
npm install --silent || error_exit "Échec de l'installation des dépendances"
success "Dépendances Backend installées"

info "Installation de amqplib pour RabbitMQ..."
npm install amqplib @types/amqplib --silent || error_exit "Échec de l'installation de amqplib"
success "amqplib installé"

echo ""

# Installation des dépendances Lambda
echo -e "${MAGENTA}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${MAGENTA}  Étape 3/6 : Installation des dépendances Lambda${NC}"
echo -e "${MAGENTA}═══════════════════════════════════════════════════════════════${NC}\n"

cd lambda/cognito-custom-message

info "Installation des dépendances Lambda..."
npm install --silent || error_exit "Échec de l'installation des dépendances Lambda"
success "Dépendances Lambda installées"

cd ../..

echo ""

# Démarrage de RabbitMQ
echo -e "${MAGENTA}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${MAGENTA}  Étape 4/6 : Démarrage de RabbitMQ${NC}"
echo -e "${MAGENTA}═══════════════════════════════════════════════════════════════${NC}\n"

if [ "$DOCKER_AVAILABLE" = true ]; then
    info "Démarrage de RabbitMQ avec Docker..."
    
    # Vérifier si le conteneur existe déjà
    if docker ps -a | grep -q clefcloud-rabbitmq; then
        warning "Conteneur RabbitMQ existe déjà. Redémarrage..."
        docker start clefcloud-rabbitmq > /dev/null 2>&1 || true
    else
        docker-compose -f docker-compose.rabbitmq.yml up -d || error_exit "Échec du démarrage de RabbitMQ"
    fi
    
    info "Attente du démarrage de RabbitMQ (10s)..."
    sleep 10
    
    success "RabbitMQ démarré"
    info "Management UI: http://localhost:15672 (admin/admin123)"
else
    warning "Docker non disponible. Installez RabbitMQ manuellement:"
    echo "  Ubuntu/Debian: sudo apt-get install rabbitmq-server"
    echo "  macOS: brew install rabbitmq"
    echo ""
    read -p "Appuyez sur Entrée une fois RabbitMQ installé et démarré..."
fi

echo ""

# Migration PostgreSQL
echo -e "${MAGENTA}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${MAGENTA}  Étape 5/6 : Migration PostgreSQL${NC}"
echo -e "${MAGENTA}═══════════════════════════════════════════════════════════════${NC}\n"

if [ "$PSQL_AVAILABLE" = true ]; then
    info "Vérification de la configuration PostgreSQL..."
    
    if [ -f ".env" ]; then
        source .env
        
        if [ -n "$RDS_ENDPOINT" ] && [ -n "$DB_USERNAME" ] && [ -n "$DB_PASSWORD" ]; then
            info "Configuration PostgreSQL trouvée"
            
            read -p "Voulez-vous appliquer la migration maintenant ? (y/n) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                cd migrations
                ./apply-migration.sh || warning "Échec de la migration. Appliquez-la manuellement."
                cd ..
                success "Migration appliquée"
            else
                warning "Migration ignorée. Appliquez-la manuellement avec: cd migrations && ./apply-migration.sh"
            fi
        else
            warning "Configuration PostgreSQL incomplète dans .env"
            info "Configurez RDS_ENDPOINT, DB_USERNAME, DB_PASSWORD dans .env"
            info "Puis exécutez: cd migrations && ./apply-migration.sh"
        fi
    else
        warning "Fichier .env non trouvé"
        info "Créez un fichier .env avec la configuration PostgreSQL"
        info "Puis exécutez: cd migrations && ./apply-migration.sh"
    fi
else
    warning "psql non disponible. Installez-le:"
    echo "  Ubuntu/Debian: sudo apt-get install postgresql-client"
    echo "  macOS: brew install postgresql"
    info "Puis exécutez: cd migrations && ./apply-migration.sh"
fi

echo ""

# Configuration
echo -e "${MAGENTA}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${MAGENTA}  Étape 6/6 : Configuration${NC}"
echo -e "${MAGENTA}═══════════════════════════════════════════════════════════════${NC}\n"

info "Vérification du fichier .env..."

if [ ! -f ".env" ]; then
    warning "Fichier .env non trouvé"
    info "Créez un fichier .env avec les variables suivantes:"
    echo ""
    cat << 'EOF'
# RabbitMQ
RABBITMQ_URL=amqp://admin:admin123@localhost:5672

# Email Provider
EMAIL_PROVIDER=SES
FROM_EMAIL=noreply@clefcloud.com

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret

# PostgreSQL
RDS_ENDPOINT=your-db-host:5432
DB_NAME=clefcloud
DB_USERNAME=your_username
DB_PASSWORD=your_password
EOF
    echo ""
else
    success "Fichier .env trouvé"
    
    # Vérifier les variables importantes
    source .env
    
    if [ -z "$RABBITMQ_URL" ]; then
        warning "RABBITMQ_URL non configuré dans .env"
    else
        success "RABBITMQ_URL configuré"
    fi
    
    if [ -z "$EMAIL_PROVIDER" ]; then
        warning "EMAIL_PROVIDER non configuré dans .env"
    else
        success "EMAIL_PROVIDER configuré: $EMAIL_PROVIDER"
    fi
fi

echo ""

# Résumé
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  ✅ Installation terminée !${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}\n"

echo -e "${GREEN}📦 Composants installés:${NC}"
echo -e "  ✅ Dépendances Backend NestJS"
echo -e "  ✅ Dépendances Lambda"
if [ "$DOCKER_AVAILABLE" = true ]; then
    echo -e "  ✅ RabbitMQ (Docker)"
fi
echo ""

echo -e "${YELLOW}📝 Prochaines étapes:${NC}\n"

echo -e "${BLUE}1. Démarrer le backend:${NC}"
echo -e "   ${CYAN}npm run start:dev${NC}\n"

if [ "$AWS_AVAILABLE" = true ]; then
    echo -e "${BLUE}2. Déployer la Lambda:${NC}"
    echo -e "   ${CYAN}cd lambda/cognito-custom-message${NC}"
    echo -e "   ${CYAN}./deploy.sh create${NC}\n"
else
    echo -e "${BLUE}2. Installer AWS CLI et déployer la Lambda:${NC}"
    echo -e "   ${CYAN}https://aws.amazon.com/cli/${NC}\n"
fi

echo -e "${BLUE}3. Tester le système:${NC}"
echo -e "   ${CYAN}curl -X POST http://localhost:3000/api/auth/signup \\${NC}"
echo -e "   ${CYAN}  -H \"Content-Type: application/json\" \\${NC}"
echo -e "   ${CYAN}  -d '{\"email\":\"test@example.com\",\"password\":\"Test1234!\",\"firstName\":\"Test\",\"lastName\":\"User\"}'${NC}\n"

echo -e "${BLUE}4. Vérifier RabbitMQ:${NC}"
echo -e "   ${CYAN}http://localhost:15672${NC} (admin/admin123)\n"

echo -e "${BLUE}5. Consulter la documentation:${NC}"
echo -e "   ${CYAN}cat VERIFICATION_QUICK_START.md${NC}"
echo -e "   ${CYAN}cat COGNITO_VERIFICATION_COMPLETE_GUIDE.md${NC}\n"

echo -e "${GREEN}🎉 Bon développement !${NC}\n"

exit 0
