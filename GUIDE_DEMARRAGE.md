# 🚀 Guide de Démarrage Rapide - ClefCloud

## Étape 1 : Configuration Firebase

### 1.1 Créer un projet Firebase

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Cliquez sur "Ajouter un projet"
3. Nommez votre projet (ex: "clefcloud")
4. Désactivez Google Analytics (optionnel)
5. Cliquez sur "Créer le projet"

### 1.2 Activer l'authentification

1. Dans le menu de gauche, cliquez sur "Authentication"
2. Cliquez sur "Commencer"
3. Activez les méthodes de connexion :
   - **Email/Password** : Activez cette option
   - **Google** (optionnel) : Activez cette option

### 1.3 Créer Firestore Database

1. Dans le menu de gauche, cliquez sur "Firestore Database"
2. Cliquez sur "Créer une base de données"
3. Choisissez "Commencer en mode test" (nous déploierons les règles de sécurité après)
4. Sélectionnez une région proche de vous (ex: europe-west1)
5. Cliquez sur "Activer"

### 1.4 Créer Storage

1. Dans le menu de gauche, cliquez sur "Storage"
2. Cliquez sur "Commencer"
3. Choisissez "Commencer en mode test"
4. Sélectionnez la même région que Firestore
5. Cliquez sur "Terminé"

### 1.5 Récupérer les credentials Firebase

1. Cliquez sur l'icône ⚙️ (Paramètres) > "Paramètres du projet"
2. Faites défiler jusqu'à "Vos applications"
3. Cliquez sur l'icône Web `</>`
4. Nommez votre app (ex: "ClefCloud Web")
5. **NE PAS** cocher "Configurer Firebase Hosting"
6. Cliquez sur "Enregistrer l'application"
7. Copiez les valeurs de `firebaseConfig`

### 1.6 Configurer les variables d'environnement

1. Créez un fichier `.env` à la racine du projet :
```bash
cp .env.example .env
```

2. Ouvrez `.env` et remplissez avec vos credentials :
```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=votre-projet.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=votre-projet
VITE_FIREBASE_STORAGE_BUCKET=votre-projet.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

## Étape 2 : Installation et Lancement

### 2.1 Installer les dépendances

```bash
npm install
```

### 2.2 Lancer en développement

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

## Étape 3 : Déployer les règles de sécurité

### 3.1 Installer Firebase CLI

```bash
npm install -g firebase-tools
```

### 3.2 Se connecter à Firebase

```bash
firebase login
```

### 3.3 Initialiser Firebase dans le projet

```bash
firebase use --add
```

Sélectionnez votre projet Firebase dans la liste.

### 3.4 Modifier .firebaserc

Ouvrez `.firebaserc` et remplacez `"votre-project-id"` par votre vrai ID de projet :

```json
{
  "projects": {
    "default": "votre-vrai-project-id"
  }
}
```

### 3.5 Déployer les règles

```bash
firebase deploy --only firestore:rules,storage:rules
```

## Étape 4 : Tester l'application

### 4.1 Créer un compte

1. Ouvrez `http://localhost:5173`
2. Cliquez sur "Inscription"
3. Créez un compte avec votre email

### 4.2 Ajouter une partition

1. Cliquez sur "Ajouter"
2. Remplissez le formulaire :
   - Titre : "Ave Maria"
   - Compositeur : "Schubert"
   - Tonalité : "Do majeur"
   - Catégorie : "Messe"
   - Partie de la messe : "Communion"
   - Tags : "classique, liturgique"
3. Sélectionnez un fichier PDF ou image
4. Cliquez sur "Ajouter la partition"

### 4.3 Consulter vos partitions

- **Bibliothèque** : Voir toutes vos partitions avec filtres
- **Messe** : Sélectionner une partie de la messe pour voir les partitions correspondantes

## Étape 5 : Déploiement en production (Firebase Hosting)

### 5.1 Build de production

```bash
npm run build
```

### 5.2 Déployer sur Firebase Hosting

```bash
firebase deploy --only hosting
```

### 5.3 Accéder à votre site

Votre site sera accessible sur : `https://votre-projet.web.app`

## 🎯 Résumé des commandes essentielles

```bash
# Installation
npm install

# Développement
npm run dev

# Build production
npm run build

# Déploiement Firebase
firebase login
firebase use --add
firebase deploy --only firestore:rules,storage:rules
firebase deploy --only hosting

# Déploiement complet
firebase deploy
```

## 🐛 Dépannage

### Erreur : "Firebase config not found"
- Vérifiez que le fichier `.env` existe et contient toutes les variables
- Redémarrez le serveur de développement après avoir modifié `.env`

### Erreur : "Permission denied" lors de l'upload
- Vérifiez que les règles Storage sont bien déployées
- Vérifiez que vous êtes bien connecté

### Erreur : "Missing or insufficient permissions" sur Firestore
- Vérifiez que les règles Firestore sont bien déployées
- Vérifiez que le champ `createdBy` correspond à votre `uid`

### L'application ne se lance pas
```bash
# Nettoyer et réinstaller
rm -rf node_modules package-lock.json
npm install
npm run dev
```

## 📞 Support

Pour toute question, consultez le README.md ou utilisez la page Contact de l'application.

## ✅ Checklist de démarrage

- [ ] Projet Firebase créé
- [ ] Authentication activée (Email/Password)
- [ ] Firestore Database créée
- [ ] Storage créé
- [ ] Credentials copiés dans `.env`
- [ ] Dépendances installées (`npm install`)
- [ ] Application lancée (`npm run dev`)
- [ ] Firebase CLI installé
- [ ] Connecté à Firebase (`firebase login`)
- [ ] Règles de sécurité déployées
- [ ] Compte test créé
- [ ] Première partition ajoutée avec succès

Bon développement ! 🎵
