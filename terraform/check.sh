#!/bin/bash

echo "🔍 Vérification de l’environnement Terraform..."

# 1. Vérifier que Terraform est installé
if ! command -v terraform &> /dev/null; then
  echo "❌ Terraform n'est pas installé. Installe-le avant de continuer."
  exit 1
fi

# 2. Vérifier que la clé publique SSH existe
KEY_PATH="${HOME}/.ssh/id_rsa.pub"
if [ ! -f "$KEY_PATH" ]; then
  echo "❌ Clé publique SSH non trouvée à $KEY_PATH"
  echo "💡 Exécute : ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa"
  exit 1
else
  echo "✅ Clé SSH trouvée : $KEY_PATH"
fi

# 3. Initialiser Terraform si nécessaire
if [ ! -d ".terraform" ]; then
  echo "📦 Initialisation de Terraform..."
  terraform init -upgrade || exit 1
fi

# 4. Vérifier la syntaxe et les erreurs de configuration
echo "🧪 Analyse du plan Terraform..."
terraform validate || exit 1

# 5. Générer un plan et le sauvegarder
echo "📋 Génération du plan Terraform..."
terraform plan -out=tfplan

# 6. Résumé
echo "✅ Vérification terminée. Tu peux maintenant exécuter : terraform apply tfplan"
