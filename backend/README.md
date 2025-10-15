# ClefCloud Backend API

Backend NestJS pour ClefCloud avec intégration AWS complète (S3, Cognito, RDS).

## 🚀 Technologies

- **NestJS** - Framework Node.js
- **TypeScript** - Langage
- **TypeORM** - ORM pour PostgreSQL
- **AWS SDK** - S3, Cognito, RDS
- **Swagger** - Documentation API

## 📋 Prérequis

- Node.js 20+
- PostgreSQL (ou AWS RDS)
- Compte AWS avec:
  - S3 Bucket
  - Cognito User Pool
  - RDS PostgreSQL (optionnel)

## 🔧 Installation

```bash
# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env

# Configurer les variables d'environnement dans .env
```

## ⚙️ Configuration

Créez un fichier `.env` avec les variables suivantes:

```env
NODE_ENV=development
PORT=3000

# AWS
AWS_REGION=eu-west-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# S3
S3_BUCKET=clefcloud-partitions-dev

# Cognito
COGNITO_USER_POOL_ID=eu-west-1_xxxxxxxxx
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx

# RDS PostgreSQL
RDS_ENDPOINT=your-db.xxxxxxxxxx.eu-west-1.rds.amazonaws.com:5432
DB_NAME=clefcloud
DB_USERNAME=clefcloud_admin
DB_PASSWORD=your_password

# CORS
CORS_ORIGIN=http://localhost:5173
```

## 🏃 Démarrage

```bash
# Développement
npm run start:dev

# Production
npm run build
npm run start:prod
```

## 📚 Documentation API

Une fois l'application démarrée, accédez à la documentation Swagger:

```
http://localhost:3000/api/docs
```

## 🔐 Endpoints Principaux

### Authentification
- `POST /api/auth/signup` - Inscription
- `POST /api/auth/confirm-signup` - Confirmation email
- `POST /api/auth/signin` - Connexion
- `POST /api/auth/forgot-password` - Mot de passe oublié
- `POST /api/auth/confirm-forgot-password` - Confirmer nouveau mot de passe

### Partitions
- `POST /api/partitions/upload` - Upload partition (authentifié)
- `GET /api/partitions` - Liste des partitions
- `GET /api/partitions/:id` - Détails d'une partition
- `GET /api/partitions/:id/download` - URL de téléchargement
- `DELETE /api/partitions/:id` - Supprimer partition (authentifié)

### Utilisateurs
- `GET /api/users/:id` - Profil utilisateur
- `GET /api/users/:id/partitions` - Partitions d'un utilisateur
- `PUT /api/users/:id` - Mettre à jour profil (authentifié)

### Health
- `GET /health` - Health check

## 🧪 Tests

```bash
# Tests unitaires
npm run test

# Tests e2e
npm run test:e2e

# Couverture
npm run test:cov
```

## 📦 Déploiement

### Avec Docker

```bash
docker build -t clefcloud-backend .
docker run -p 3000:3000 --env-file .env clefcloud-backend
```

### Sur AWS EC2

Voir le dossier `terraform/` pour l'infrastructure complète.

## 🏗️ Architecture

```
src/
├── auth/           # Authentification Cognito
├── aws/            # Services AWS (S3, Cognito)
├── partitions/     # Gestion des partitions
├── users/          # Gestion des utilisateurs
├── health/         # Health check
├── app.module.ts   # Module principal
└── main.ts         # Point d'entrée
```

## 🔒 Sécurité

- Authentification via AWS Cognito
- JWT tokens
- Validation des entrées avec class-validator
- Guards NestJS pour les routes protégées
- CORS configuré

## 📝 License

MIT
