# ClefCloud Frontend

Interface utilisateur React pour ClefCloud - Application de gestion de partitions musicales.

## 🚀 Démarrage rapide

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev

# Build pour la production
npm run build
```

## 📁 Structure

```
frontend/
├── src/
│   ├── components/      # Composants réutilisables
│   ├── contexts/        # Contextes React (Auth, etc.)
│   ├── pages/          # Pages de l'application
│   ├── services/       # Services API
│   ├── aws/            # Configuration AWS
│   ├── firebase/       # Configuration Firebase (legacy)
│   └── supabase/       # Configuration Supabase (legacy)
├── public/             # Fichiers statiques
└── index.html          # Point d'entrée HTML
```

## 🔧 Technologies

- **React 19** - Framework UI
- **Vite** - Build tool
- **React Router** - Routing
- **TailwindCSS** - Styling
- **AWS Cognito** - Authentification
- **Axios** - HTTP client

## 🔗 Backend

Le backend NestJS se trouve dans le dossier `../backend/`

API URL: `http://localhost:3000/api`

## 📝 Configuration

Créez un fichier `.env` à la racine du dossier frontend :

```env
VITE_API_URL=http://localhost:3000/api
VITE_AWS_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=your_user_pool_id
VITE_COGNITO_CLIENT_ID=your_client_id
```

## 🎯 Fonctionnalités

- ✅ Authentification (Inscription, Connexion, Déconnexion)
- ✅ Gestion des partitions (Upload, Liste, Recherche)
- ✅ Favoris
- ✅ Profil utilisateur
- ✅ Statistiques
- ✅ Visualisation PDF

## 📚 Documentation

Pour plus d'informations, consultez la documentation dans `../backend/AUTHENTICATION_SUMMARY.md`
