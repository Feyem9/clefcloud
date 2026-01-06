#!/bin/bash

# Script de déploiement du backend sur AWS EC2

set -e

echo "🚀 Déploiement du backend ClefCloud sur AWS EC2"

# Variables
EC2_HOST=${EC2_HOST:-""}
EC2_USER=${EC2_USER:-"ubuntu"}
SSH_KEY=${SSH_KEY:-"~/.ssh/id_rsa"}
APP_DIR="/opt/clefcloud"

if [ -z "$EC2_HOST" ]; then
  echo "❌ Erreur: EC2_HOST n'est pas défini"
  echo "Usage: EC2_HOST=your-ec2-ip.amazonaws.com ./deploy-backend.sh"
  exit 1
fi

echo "📦 Construction de l'application..."
cd ../backend
npm run build

echo "📤 Upload des fichiers vers EC2..."
rsync -avz --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'dist' \
  -e "ssh -i $SSH_KEY" \
  ./ ${EC2_USER}@${EC2_HOST}:${APP_DIR}/

echo "📥 Installation des dépendances sur EC2..."
ssh -i $SSH_KEY ${EC2_USER}@${EC2_HOST} << 'EOF'
  cd /opt/clefcloud
  npm ci --only=production
  npm run build
EOF

echo "🔄 Redémarrage de l'application avec PM2..."
ssh -i $SSH_KEY ${EC2_USER}@${EC2_HOST} << 'EOF'
  cd /opt/clefcloud
  pm2 delete clefcloud-backend || true
  pm2 start dist/main.js --name clefcloud-backend
  pm2 save
EOF

echo "✅ Déploiement terminé!"
echo "🌐 Backend disponible sur: http://${EC2_HOST}:3000"
