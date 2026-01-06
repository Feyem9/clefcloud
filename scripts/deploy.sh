#!/bin/bash

# Récupérer l'IP publique de l'instance EC2 clefcloud-backend
EC2_IP=$(aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=clefcloud-backend" "Name=instance-state-name,Values=running" \
  --query "Reservations[0].Instances[0].PublicIpAddress" \
  --output text)

# Vérifier que l'IP a bien été récupérée
if [ -z "$EC2_IP" ] || [ "$EC2_IP" == "None" ]; then
  echo "❌ Impossible de récupérer l'IP de l'instance EC2."
  exit 1
fi

echo "✅ IP de l'EC2 récupérée : $EC2_IP"

# Lancer le script de déploiement en passant l'IP comme variable d'environnement
EC2_HOST=$EC2_IP ./scripts/deploy-backend.sh
