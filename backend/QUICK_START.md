# 🚀 Guide de démarrage rapide - ClefCloud Backend

## 📋 Prérequis

- ✅ Node.js 18+ installé
- ✅ PostgreSQL configuré (AWS RDS)
- ✅ AWS Cognito configuré
- ✅ Variables d'environnement dans `.env`

## ⚡ Démarrage en 5 minutes

### 1. Installation des dépendances

```bash
npm install
```

### 2. Vérification de la configuration

Assurez-vous que votre fichier `.env` contient :

```env
# Node
NODE_ENV=development
PORT=3000

# AWS RDS PostgreSQL
RDS_ENDPOINT=clefcloud.cqtea40yk74r.us-east-1.rds.amazonaws.com:5432
DB_NAME=clefcloud
DB_USERNAME=postgres
DB_PASSWORD="Qwerty1!#-55"

# AWS Cognito
COGNITO_REGION=us-east-1
COGNITO_USER_POOL_ID=us-east-1_dl0kSgKUl
COGNITO_CLIENT_ID=2pu1v5mpa5eht36m8im2ns40sf
COGNITO_CLIENT_SECRET=1saki51oveii86gtgrjl75bs9scsn81eb63b7610f0lfmeerffdd
COGNITO_ISSUER_URL=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_dl0kSgKUl

# Session
SESSION_SECRET=4825453272cb127e79340d3560f2cc7ae4596bfc8d7e0f91d56a02c75c8d11db

# S3
S3_BUCKET=clefcloud-partitions-dev

# CORS
CORS_ORIGIN=http://localhost:5173
```

### 3. Test de connexion à la base de données

```bash
node test-db-connection.js
```

Vous devriez voir :
```
✅ Connexion réussie !
⏰ Heure du serveur: 2025-10-14T12:20:55.157Z
```

### 4. Compilation

```bash
npm run build
```

### 5. Démarrage du serveur

```bash
npm run start:dev
```

Le serveur démarre sur `http://localhost:3000`

### 6. Vérification

Ouvrez votre navigateur :

- **API Documentation** : http://localhost:3000/api
- **Health Check** : http://localhost:3000/health

---

## 🧪 Tests rapides

### Test 1 : Health Check

```bash
curl http://localhost:3000/health
```

**Résultat attendu :**
```json
{
  "status": "ok",
  "timestamp": "2025-10-14T14:20:00.000Z"
}
```

### Test 2 : Liste des partitions

```bash
curl http://localhost:3000/partitions
```

### Test 3 : Authentification

```bash
curl -X POST http://localhost:3000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "Password123!"
  }'
```

---

## 📚 Documentation disponible

| Fichier | Description |
|---------|-------------|
| `COGNITO_SETUP.md` | Configuration OpenID Connect |
| `COGNITO_NESTJS_INTEGRATION.md` | Intégration Cognito dans NestJS |
| `FEATURES_ADDED.md` | Nouvelles fonctionnalités |
| `INTEGRATION_SUMMARY.md` | Résumé de l'intégration |
| `test-cognito-auth.http` | Tests d'authentification |
| `test-features.http` | Tests des fonctionnalités |

---

## 🎯 Endpoints principaux

### Authentification
- `POST /auth/signup` - Inscription
- `POST /auth/signin` - Connexion
- `GET /auth/me` - Profil utilisateur (protégé)

### Partitions
- `GET /partitions` - Liste des partitions
- `POST /partitions/upload` - Upload (protégé)
- `GET /partitions/:id` - Détails
- `GET /partitions/:id/download` - Télécharger
- `DELETE /partitions/:id` - Supprimer (protégé)

### Favoris
- `POST /partitions/:id/favorite` - Ajouter (protégé)
- `DELETE /partitions/:id/favorite` - Retirer (protégé)
- `GET /partitions/favorites/list` - Liste (protégé)

### Statistiques
- `GET /partitions/stats/user` - Stats utilisateur (protégé)
- `GET /partitions/stats/popular` - Partitions populaires (public)

---

## 🔧 Commandes utiles

### Développement
```bash
npm run start:dev       # Démarrage avec hot-reload
npm run build          # Compilation TypeScript
npm run lint           # Vérification du code
npm run format         # Formatage du code
```

### Tests
```bash
npm run test           # Tests unitaires
npm run test:watch     # Tests en mode watch
npm run test:cov       # Couverture de code
npm run test:e2e       # Tests end-to-end
```

### Base de données
```bash
node test-db-connection.js    # Test de connexion
node create-database.js       # Créer la base de données
```

---

## 🐛 Dépannage

### Erreur : "Cannot connect to database"

**Solution :**
1. Vérifiez que RDS est accessible (Security Group)
2. Vérifiez les credentials dans `.env`
3. Testez avec : `node test-db-connection.js`

### Erreur : "Invalid token" ou 401 Unauthorized

**Solution :**
1. Vérifiez que le token JWT n'est pas expiré
2. Vérifiez `COGNITO_ISSUER_URL` dans `.env`
3. Reconnectez-vous pour obtenir un nouveau token

### Erreur : "Module not found"

**Solution :**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Port 3000 déjà utilisé

**Solution :**
```bash
# Changer le port dans .env
PORT=3001

# Ou tuer le processus
lsof -ti:3000 | xargs kill -9
```

---

## 📊 Structure du projet

```
backend/
├── src/
│   ├── auth/                    # Authentification Cognito
│   │   ├── strategies/          # Stratégie JWT
│   │   ├── guards/              # Guards de protection
│   │   ├── decorators/          # Decorators personnalisés
│   │   └── dto/                 # Data Transfer Objects
│   ├── partitions/              # Gestion des partitions
│   │   ├── entities/            # Entités (Partition, Favorite)
│   │   ├── dto/                 # DTOs
│   │   ├── partitions.service.ts
│   │   └── partitions.controller.ts
│   ├── users/                   # Gestion des utilisateurs
│   │   ├── entities/            # Entité User
│   │   ├── users.service.ts
│   │   └── users.controller.ts
│   ├── aws/                     # Services AWS (S3, Cognito)
│   ├── health/                  # Health checks
│   ├── app.module.ts            # Module principal
│   └── main.ts                  # Point d'entrée
├── test/                        # Tests E2E
├── .env                         # Variables d'environnement
├── package.json                 # Dépendances
└── tsconfig.json               # Configuration TypeScript
```

---

## 🔐 Sécurité

### Routes protégées
Toutes les routes sensibles nécessitent un JWT valide :
- Upload de partitions
- Suppression de partitions
- Gestion des favoris
- Statistiques utilisateur

### Routes publiques
Accessibles sans authentification :
- Liste des partitions
- Détails d'une partition
- Partitions populaires
- Téléchargement (URL signée temporaire)

---

## 🚀 Prochaines étapes

1. **Tester l'API** avec les fichiers `.http` fournis
2. **Créer un utilisateur** dans Cognito
3. **Uploader des partitions** de test
4. **Intégrer le frontend** avec l'API
5. **Déployer en production** (voir documentation de déploiement)

---

## 📞 Support

- **Documentation complète** : Voir les fichiers `.md` dans le dossier backend
- **Swagger UI** : http://localhost:3000/api
- **Logs** : Les logs sont affichés dans la console en mode développement

---

## ✅ Checklist de vérification

Avant de commencer le développement :

- [ ] Base de données PostgreSQL accessible
- [ ] Cognito User Pool configuré
- [ ] Variables d'environnement correctes
- [ ] `npm install` exécuté avec succès
- [ ] `npm run build` sans erreurs
- [ ] Serveur démarre sur le port 3000
- [ ] Health check répond correctement
- [ ] Documentation Swagger accessible

**Tout est vert ? Vous êtes prêt à développer ! 🎉**
