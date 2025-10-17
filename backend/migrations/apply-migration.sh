#!/bin/bash

# Script pour appliquer les migrations PostgreSQL
# Usage: ./apply-migration.sh [migration_file]

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Charger les variables d'environnement
if [ -f "../.env" ]; then
    export $(cat ../.env | grep -v '^#' | xargs)
fi

# Configuration PostgreSQL
DB_HOST="${RDS_ENDPOINT%%:*}"
DB_PORT="${RDS_ENDPOINT##*:}"
DB_NAME="${DB_NAME:-clefcloud}"
DB_USER="${DB_USERNAME}"
DB_PASSWORD="${DB_PASSWORD}"

echo -e "${BLUE}🗄️  Application des migrations PostgreSQL${NC}\n"

# Vérifier que psql est installé
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ psql n'est pas installé${NC}"
    echo -e "${YELLOW}Installation:${NC}"
    echo -e "  Ubuntu/Debian: sudo apt-get install postgresql-client"
    echo -e "  macOS: brew install postgresql"
    exit 1
fi

# Vérifier les variables d'environnement
if [ -z "$DB_HOST" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ]; then
    echo -e "${RED}❌ Variables d'environnement manquantes${NC}"
    echo -e "${YELLOW}Vérifiez votre fichier .env:${NC}"
    echo -e "  RDS_ENDPOINT=your-db-host:5432"
    echo -e "  DB_USERNAME=your-username"
    echo -e "  DB_PASSWORD=your-password"
    echo -e "  DB_NAME=clefcloud"
    exit 1
fi

# Déterminer le fichier de migration
if [ -n "$1" ]; then
    MIGRATION_FILE="$1"
else
    # Appliquer toutes les migrations dans l'ordre
    MIGRATION_FILE="001_create_verification_codes_table.sql"
fi

if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}❌ Fichier de migration introuvable: $MIGRATION_FILE${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Configuration:${NC}"
echo -e "  Host: $DB_HOST"
echo -e "  Port: $DB_PORT"
echo -e "  Database: $DB_NAME"
echo -e "  User: $DB_USER"
echo -e "  Migration: $MIGRATION_FILE"
echo ""

# Tester la connexion
echo -e "${YELLOW}🔌 Test de connexion...${NC}"
export PGPASSWORD="$DB_PASSWORD"

if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${RED}❌ Impossible de se connecter à la base de données${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Connexion réussie${NC}\n"

# Appliquer la migration
echo -e "${YELLOW}🚀 Application de la migration: $MIGRATION_FILE${NC}"

psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✅ Migration appliquée avec succès !${NC}\n"
    
    # Vérifier que la table existe
    echo -e "${YELLOW}🔍 Vérification de la table...${NC}"
    
    TABLE_EXISTS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'verification_codes');")
    
    if [[ "$TABLE_EXISTS" == *"t"* ]]; then
        echo -e "${GREEN}✅ Table verification_codes créée${NC}"
        
        # Afficher la structure
        echo -e "\n${BLUE}📊 Structure de la table:${NC}"
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "\d verification_codes"
        
        # Afficher les index
        echo -e "\n${BLUE}📑 Index créés:${NC}"
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'verification_codes';"
        
    else
        echo -e "${RED}❌ La table n'a pas été créée${NC}"
        exit 1
    fi
    
else
    echo -e "\n${RED}❌ Échec de la migration${NC}"
    exit 1
fi

# Nettoyer
unset PGPASSWORD

echo -e "\n${GREEN}✅ Terminé !${NC}\n"

exit 0
