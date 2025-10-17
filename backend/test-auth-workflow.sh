#!/bin/bash

# Script de test du workflow d'authentification complet
# Usage: ./test-auth-workflow.sh

BASE_URL="http://localhost:3000/api"
EMAIL="pasyves43@gmail.com"
PASSWORD="Password123!"

echo "🔐 Test du workflow d'authentification ClefCloud"
echo "=================================================="
echo ""

# Étape 1 : Connexion
echo "📝 Étape 1 : Connexion..."
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/signin" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

echo "Réponse: $RESPONSE"
echo ""

# Extraire le token avec jq
if command -v jq &> /dev/null; then
  ACCESS_TOKEN=$(echo "$RESPONSE" | jq -r '.tokens.accessToken')
  
  if [ "$ACCESS_TOKEN" != "null" ] && [ -n "$ACCESS_TOKEN" ]; then
    echo "✅ Token extrait avec succès!"
    echo "Token (premiers 50 caractères): ${ACCESS_TOKEN:0:50}..."
    echo ""
    
    # Étape 2 : Test du token
    echo "📝 Étape 2 : Test du token - Récupération du profil..."
    PROFILE_RESPONSE=$(curl -s -X GET "$BASE_URL/auth/me" \
      -H "Authorization: Bearer $ACCESS_TOKEN")
    
    echo "Réponse: $PROFILE_RESPONSE"
    echo ""
    
    if echo "$PROFILE_RESPONSE" | jq -e '.email' &> /dev/null; then
      echo "✅ Token valide! Profil récupéré avec succès!"
      echo ""
      echo "📊 Informations utilisateur:"
      echo "$PROFILE_RESPONSE" | jq '.'
    else
      echo "❌ Erreur: Le token ne semble pas valide"
    fi
  else
    echo "❌ Erreur: Impossible d'extraire le token"
    echo "Vérifiez que l'utilisateur est bien confirmé et que les credentials sont corrects"
  fi
else
  echo "⚠️  jq n'est pas installé. Impossible d'extraire automatiquement le token."
  echo "Réponse brute:"
  echo "$RESPONSE"
  echo ""
  echo "Pour installer jq: sudo apt-get install jq"
fi

echo ""
echo "=================================================="
echo "✅ Test terminé"
