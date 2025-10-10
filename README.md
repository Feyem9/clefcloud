# 🎵 ClefCloud - Sauvegarde de Partitions Musicales

ClefCloud est une application web de gestion et sauvegarde de partitions musicales dans le cloud, spécialement conçue pour les pianistes et organistes.

## ✨ Fonctionnalités

- **Authentification sécurisée** : Connexion par email/mot de passe ou Google
- **Upload de partitions** : Support PDF, PNG, JPG (max 10MB)
- **Organisation par catégories** : Messe, Concert, Autre
- **Parties de messe** : Organisation spéciale pour les partitions liturgiques (Entrée, Kyrie, Gloria, Psaume, Alleluia, Offertoire, Sanctus, Agnus Dei, Communion, Sortie)
- **Recherche et filtres** : Trouvez rapidement vos partitions
- **Accès mobile** : Consultez vos partitions depuis n'importe quel appareil
- **Stockage cloud** : Firebase Storage pour une sauvegarde sécurisée

## 🚀 Technologies

- **Frontend** : React.js + Vite
- **Styling** : Tailwind CSS
- **Backend** : Firebase (Authentication, Firestore, Storage, Hosting)
- **Routing** : React Router v6

## 📋 Prérequis

- Node.js (v16 ou supérieur)
- npm ou yarn
- Un compte Firebase

## 🛠️ Installation

1. **Cloner le projet**
```bash
git clone <votre-repo>
cd ClefCloud
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer Firebase**

   a. Créez un projet sur [Firebase Console](https://console.firebase.google.com/)
   
   b. Activez les services suivants :
      - Authentication (Email/Password et Google)
      - Firestore Database
      - Storage
      - Hosting
   
   c. Copiez `.env.example` vers `.env` et remplissez avec vos credentials Firebase :
   ```bash
   cp .env.example .env
   ```
   
   d. Modifiez `.env` avec vos informations :
   ```env
   VITE_FIREBASE_API_KEY=votre_api_key
   VITE_FIREBASE_AUTH_DOMAIN=votre_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=votre_project_id
   VITE_FIREBASE_STORAGE_BUCKET=votre_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=votre_sender_id
   VITE_FIREBASE_APP_ID=votre_app_id
   ```

4. **Déployer les règles de sécurité Firebase**
```bash
# Installer Firebase CLI si ce n'est pas déjà fait
npm install -g firebase-tools

# Se connecter à Firebase
firebase login

# Initialiser Firebase (sélectionnez votre projet)
firebase use --add

# Déployer les règles Firestore et Storage
firebase deploy --only firestore:rules,storage:rules
```

## 🏃 Lancer l'application en développement

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

## 🏗️ Build pour la production

```bash
npm run build
```

Les fichiers de production seront dans le dossier `dist/`

## 🚀 Déploiement sur Firebase Hosting

```bash
# Build de l'application
npm run build

# Déployer sur Firebase Hosting
firebase deploy --only hosting
```

## 📁 Structure du projet

```
ClefCloud/
├── src/
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── Header.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── Layout.jsx
│   │   └── ProtectedRoute.jsx
│   ├── contexts/
│   │   └── AuthContext.jsx
│   ├── firebase/
│   │   └── config.js
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── Library.jsx
│   │   ├── Upload.jsx
│   │   ├── Messe.jsx
│   │   └── Contact.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── firestore.rules
├── storage.rules
├── firebase.json
├── .firebaserc
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

## 🔒 Sécurité

- Les règles Firestore garantissent que chaque utilisateur ne peut accéder qu'à ses propres partitions
- Les règles Storage limitent la taille des fichiers (10MB) et les types acceptés (PDF, images)
- L'authentification Firebase sécurise tous les accès

## 📝 Utilisation

1. **Créer un compte** : Inscrivez-vous avec votre email ou Google
2. **Ajouter une partition** : Cliquez sur "Ajouter" et remplissez le formulaire
3. **Organiser** : Classez par catégorie et partie de messe
4. **Consulter** : Accédez à vos partitions depuis "Bibliothèque" ou "Messe"
5. **Rechercher** : Utilisez les filtres pour trouver rapidement une partition

## 🎹 Cas d'usage : Messe

Pour les pianistes/organistes pendant la messe :
1. Allez sur la page "Messe"
2. Sélectionnez la partie liturgique (ex: "Offertoire")
3. Toutes vos partitions d'offertoire s'affichent
4. Ouvrez la partition souhaitée directement sur votre appareil

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## 📄 Licence

MIT

## 👤 Auteur

Créé pour faciliter la vie des musiciens liturgiques.

## 🐛 Support

Pour toute question ou problème, utilisez la page Contact de l'application.
