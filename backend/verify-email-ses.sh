#!/bin/bash

# Script pour vérifier une adresse email dans AWS SES
# Usage: ./verify-email-ses.sh pasyves43@gmail.com

EMAIL=${1:-pasyves43@gmail.com}
REGION=${2:-us-east-1}

echo "🔍 Vérification de l'email: $EMAIL dans la région: $REGION"

# Envoyer la demande de vérification
aws ses verify-email-identity \
  --email-address "$EMAIL" \
  --region "$REGION"

if [ $? -eq 0 ]; then
  echo "✅ Demande de vérification envoyée avec succès!"
  echo "📧 Vérifiez votre boîte email $EMAIL"
  echo "📬 Cliquez sur le lien de vérification dans l'email AWS"
  echo ""
  echo "Pour vérifier le statut:"
  echo "aws ses get-identity-verification-attributes --identities $EMAIL --region $REGION"
else
  echo "❌ Erreur lors de l'envoi de la demande de vérification"
  exit 1
fi
