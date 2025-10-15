# 🎵 ClefCloud Backend - Documentation Complète

## 📖 Vue d'ensemble

ClefCloud est une application de gestion de partitions musicales avec :
- 🔐 **Authentification sécurisée** via AWS Cognito
- 📁 **Stockage cloud** sur AWS S3
- 🗄️ **Base de données** PostgreSQL (AWS RDS)
- ⭐ **Système de favoris** pour les utilisateurs
- 📊 **Statistiques** et analytics en temps réel
- 🚀 **API REST** complète avec NestJS

---

## 🎯 Fonctionnalités principales

### ✅ Authentification & Autorisation
- Inscription et connexion via AWS Cognito
- Validation JWT automatique avec clés publiques (JWKS)
- Protection des routes sensibles
- Synchronisation automatique Cognito → Base de données
- Gestion des sessions et refresh tokens

### ✅ Gestion des partitions
- Upload de fichiers (PDF, PNG, JPG) vers S3
- Métadonnées complètes (titre, compositeur, catégorie, tags)
- Recherche et filtrage avancés
- URLs de téléchargement signées et temporaires
- Compteurs de vues et téléchargements
- Partitions publiques/privées

### ✅ Système de favoris
- Ajouter/retirer des partitions en favoris
- Liste personnalisée des favoris
- Contrainte d'unicité (pas de doublons)

### ✅ Statistiques & Analytics
- Statistiques utilisateur (partitions, téléchargements, vues)
- Partitions les plus populaires
- Métriques en temps réel

### ✅ Gestion des utilisateurs
- Profils utilisateurs avec avatar
- Historique des partitions uploadées
- Dernière connexion trackée
- Statut actif/inactif

---

## 🏗️ Architecture technique

### Stack technologique

**Backend**
- **Framework** : NestJS 10.x (TypeScript)
- **ORM** : TypeORM
- **Authentification** : Passport.js + JWT
- **Validation** : class-validator, class-transformer
- **Documentation** : Swagger/OpenAPI

**Infrastructure AWS**
- **Base de données** : RDS PostgreSQL
- **Stockage** : S3
- **Authentification** : Cognito User Pools
- **Région** : us-east-1

**Outils de développement**
- **Tests** : Jest
- **Linting** : ESLint + Prettier
- **Build** : TypeScript Compiler

### Architecture des modules

```
┌─────────────────────────────────────────┐
│           NestJS Application            │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────┐  ┌──────────┐  ┌───────┐ │
│  │   Auth   │  │Partitions│  │ Users │ │
│  │  Module  │  │  Module  │  │Module │ │
│  └────┬─────┘  └────┬─────┘  └───┬───┘ │
│       │             │             │     │
│  ┌────┴─────────────┴─────────────┴───┐ │
│  │         AWS Services Module        │ │
│  │  (Cognito, S3, RDS)                │ │
│  └────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
           │              │
           ▼              ▼
    ┌──────────┐   ┌──────────┐
    │ AWS RDS  │   │  AWS S3  │
    │PostgreSQL│   │ Storage  │
    └──────────┘   └──────────┘
```

---

## 📂 Structure de la base de données

### Table : `users`
```sql
id                SERIAL PRIMARY KEY
cognito_sub       VARCHAR(255) UNIQUE NOT NULL
email             VARCHAR(255) UNIQUE NOT NULL
username          VARCHAR(255)
name              VARCHAR(255)
avatar_url        VARCHAR(500)
is_active         BOOLEAN DEFAULT true
last_login        TIMESTAMP
created_at        TIMESTAMP DEFAULT NOW()
updated_at        TIMESTAMP DEFAULT NOW()
```

### Table : `partitions`
```sql
id                SERIAL PRIMARY KEY
title             VARCHAR(255) NOT NULL
composer          VARCHAR(255)
key               VARCHAR(50)
category          VARCHAR(100) NOT NULL
messe_part        VARCHAR(100)
tags              TEXT[]
storage_path      VARCHAR(500) NOT NULL
download_url      VARCHAR(500) NOT NULL
file_size         INTEGER
file_type         VARCHAR(100)
download_count    INTEGER DEFAULT 0
view_count        INTEGER DEFAULT 0
is_public         BOOLEAN DEFAULT false
is_active         BOOLEAN DEFAULT true
created_by        INTEGER REFERENCES users(id)
created_at        TIMESTAMP DEFAULT NOW()
updated_at        TIMESTAMP DEFAULT NOW()
```

### Table : `favorites`
```sql
id                SERIAL PRIMARY KEY
user_id           INTEGER REFERENCES users(id) ON DELETE CASCADE
partition_id      INTEGER REFERENCES partitions(id) ON DELETE CASCADE
created_at        TIMESTAMP DEFAULT NOW()
UNIQUE(user_id, partition_id)
```

### Index recommandés
```sql
CREATE INDEX idx_partitions_category ON partitions(category);
CREATE INDEX idx_partitions_created_by ON partitions(created_by);
CREATE INDEX idx_partitions_is_public ON partitions(is_public);
CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_partition ON favorites(partition_id);
CREATE INDEX idx_users_cognito_sub ON users(cognito_sub);
```

---

## 🔌 API Endpoints

### Authentification (`/auth`)

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/auth/signup` | ❌ | Inscription |
| POST | `/auth/signin` | ❌ | Connexion |
| POST | `/auth/confirm-signup` | ❌ | Confirmer email |
| POST | `/auth/forgot-password` | ❌ | Mot de passe oublié |
| GET | `/auth/profile` | ✅ | Profil utilisateur |
| GET | `/auth/me` | ✅ | Infos utilisateur |

### Partitions (`/partitions`)

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/partitions` | ❌ | Liste des partitions |
| GET | `/partitions/:id` | ❌ | Détails d'une partition |
| POST | `/partitions/upload` | ✅ | Upload une partition |
| GET | `/partitions/:id/download` | ❌ | URL de téléchargement |
| DELETE | `/partitions/:id` | ✅ | Supprimer une partition |
| POST | `/partitions/:id/favorite` | ✅ | Ajouter aux favoris |
| DELETE | `/partitions/:id/favorite` | ✅ | Retirer des favoris |
| GET | `/partitions/favorites/list` | ✅ | Liste des favoris |
| GET | `/partitions/stats/user` | ✅ | Stats utilisateur |
| GET | `/partitions/stats/popular` | ❌ | Partitions populaires |

### Utilisateurs (`/users`)

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/users/:id` | ❌ | Profil public |
| GET | `/users/:id/partitions` | ❌ | Partitions d'un utilisateur |
| PATCH | `/users/:id` | ✅ | Mettre à jour le profil |

### Health (`/health`)

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/health` | ❌ | Status de l'API |
| GET | `/health/db` | ❌ | Status de la DB |

---

## 🔐 Sécurité

### Authentification JWT

**Flow d'authentification :**
1. L'utilisateur se connecte via `/auth/signin`
2. Cognito retourne un JWT (access_token, id_token, refresh_token)
3. Le client envoie le JWT dans le header : `Authorization: Bearer <token>`
4. Le backend valide le JWT avec les clés publiques Cognito (JWKS)
5. Les informations utilisateur sont extraites du token

**Structure du JWT :**
```json
{
  "sub": "12345678-1234-1234-1234-123456789abc",
  "cognito:username": "john_doe",
  "email": "john@example.com",
  "email_verified": true,
  "cognito:groups": ["Users"],
  "token_use": "access",
  "iss": "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_dl0kSgKUl",
  "aud": "2pu1v5mpa5eht36m8im2ns40sf",
  "exp": 1697299200
}
```

### Protection des routes

**Guard Cognito JWT :**
```typescript
@UseGuards(CognitoJwtAuthGuard)
@Get('protected')
async protectedRoute(@CurrentUser() user: CognitoUser) {
  // Route protégée
}
```

**Route publique :**
```typescript
@Public()
@Get('public')
async publicRoute() {
  // Accessible sans authentification
}
```

### Bonnes pratiques

✅ **Tokens en HTTPS uniquement** en production  
✅ **Expiration des tokens** : 1h (configurable dans Cognito)  
✅ **Refresh tokens** pour renouveler automatiquement  
✅ **CORS** configuré pour le frontend uniquement  
✅ **Rate limiting** recommandé en production  
✅ **Validation des inputs** avec class-validator  
✅ **Sanitization** des données utilisateur  

---

## 🚀 Déploiement

### Variables d'environnement requises

```env
# Application
NODE_ENV=production
PORT=3000

# Database
RDS_ENDPOINT=your-db.rds.amazonaws.com:5432
DB_NAME=clefcloud
DB_USERNAME=clefcloud_admin
DB_PASSWORD=<secure_password>

# AWS Cognito
COGNITO_REGION=us-east-1
COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
COGNITO_CLIENT_SECRET=<client_secret>
COGNITO_ISSUER_URL=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_xxxxxxxxx

# AWS S3
S3_BUCKET=clefcloud-partitions-prod
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<access_key>
AWS_SECRET_ACCESS_KEY=<secret_key>

# Security
SESSION_SECRET=<random_64_char_string>
CORS_ORIGIN=https://your-frontend-domain.com

# Logging
LOG_LEVEL=info
```

### Checklist de déploiement

- [ ] Variables d'environnement configurées
- [ ] Base de données migrée (tables créées)
- [ ] Index de base de données créés
- [ ] Security Groups AWS configurés
- [ ] HTTPS activé (certificat SSL)
- [ ] CORS configuré pour le domaine frontend
- [ ] Logs centralisés (CloudWatch, Datadog, etc.)
- [ ] Monitoring activé (uptime, performances)
- [ ] Backups automatiques de la base de données
- [ ] Rate limiting activé
- [ ] Tests E2E passés

### Options de déploiement

**Option 1 : AWS ECS (Recommandé)**
- Conteneurisation avec Docker
- Auto-scaling
- Load balancing
- Intégration native avec RDS et S3

**Option 2 : AWS Lambda + API Gateway**
- Serverless
- Pay-per-use
- Scaling automatique

**Option 3 : EC2**
- Contrôle total
- Configuration personnalisée
- Gestion manuelle

---

## 📊 Monitoring & Logs

### Logs disponibles

```typescript
// Logs automatiques dans chaque service
this.logger.log('Partition created: ${id}');
this.logger.error('Error uploading file', error);
this.logger.warn('User not found: ${userId}');
```

### Métriques à surveiller

- **Taux de requêtes** (requests/sec)
- **Temps de réponse** (ms)
- **Taux d'erreur** (%)
- **Connexions DB** actives
- **Utilisation S3** (storage, bandwidth)
- **Authentifications** réussies/échouées

---

## 🧪 Tests

### Tests unitaires
```bash
npm run test
```

### Tests E2E
```bash
npm run test:e2e
```

### Couverture de code
```bash
npm run test:cov
```

### Tests manuels
Utilisez les fichiers `.http` fournis :
- `test-cognito-auth.http`
- `test-features.http`

---

## 📚 Documentation

| Fichier | Contenu |
|---------|---------|
| `QUICK_START.md` | Guide de démarrage rapide |
| `COGNITO_SETUP.md` | Configuration Cognito OpenID |
| `COGNITO_NESTJS_INTEGRATION.md` | Intégration JWT dans NestJS |
| `FEATURES_ADDED.md` | Nouvelles fonctionnalités |
| `INTEGRATION_SUMMARY.md` | Résumé de l'intégration |
| `README_COMPLETE.md` | Ce fichier |

---

## 🎓 Exemples d'utilisation

### Exemple 1 : Upload d'une partition

```typescript
// Frontend (React/Vue/Angular)
const formData = new FormData();
formData.append('file', file);
formData.append('title', 'Ave Maria');
formData.append('composer', 'Schubert');
formData.append('category', 'messe');

const response = await fetch('http://localhost:3000/partitions/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  },
  body: formData
});

const partition = await response.json();
console.log('Partition uploaded:', partition);
```

### Exemple 2 : Ajouter aux favoris

```typescript
const response = await fetch(`http://localhost:3000/partitions/${partitionId}/favorite`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

if (response.ok) {
  console.log('Added to favorites!');
}
```

### Exemple 3 : Récupérer les statistiques

```typescript
const response = await fetch('http://localhost:3000/partitions/stats/user', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

const stats = await response.json();
console.log('Total partitions:', stats.totalPartitions);
console.log('Total downloads:', stats.totalDownloads);
```

---

## 🤝 Contribution

### Standards de code

- **TypeScript** strict mode activé
- **ESLint** + **Prettier** pour le formatage
- **Conventional Commits** pour les messages de commit
- **Tests** requis pour les nouvelles fonctionnalités

### Workflow Git

```bash
# Créer une branche
git checkout -b feature/nouvelle-fonctionnalite

# Faire vos modifications
git add .
git commit -m "feat: ajout de la fonctionnalité X"

# Pousser et créer une PR
git push origin feature/nouvelle-fonctionnalite
```

---

## 📞 Support

- **Documentation Swagger** : http://localhost:3000/api
- **Issues GitHub** : [Lien vers le repo]
- **Email** : support@clefcloud.com

---

## 📄 Licence

MIT License - Voir le fichier LICENSE pour plus de détails

---

## 🎉 Remerciements

Merci d'utiliser ClefCloud ! Cette application a été développée avec ❤️ pour faciliter la gestion et le partage de partitions musicales.

**Version** : 1.0.0  
**Dernière mise à jour** : 14 octobre 2025  
**Auteur** : ClefCloud Team
