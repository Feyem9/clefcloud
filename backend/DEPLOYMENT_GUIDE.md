# 🚀 Guide de déploiement - ClefCloud Backend

Ce guide vous accompagne dans le déploiement des nouvelles fonctionnalités d'authentification.

---

## 📋 Prérequis

### 1. Variables d'environnement

Assurez-vous que votre fichier `.env` contient toutes les variables nécessaires :

```env
# Base de données
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=clefcloud

# AWS Cognito
AWS_REGION=eu-west-1
COGNITO_USER_POOL_ID=eu-west-1_XXXXXXXXX
COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
COGNITO_CLIENT_SECRET=XXXXXXXXXXXXXXXXXXXXXXXXXX

# AWS Credentials (optionnel si utilisation d'IAM roles)
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# AWS S3 (pour les partitions)
AWS_S3_BUCKET=clefcloud-partitions

# Email (pour les notifications)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM=noreply@clefcloud.com

# Application
PORT=3000
NODE_ENV=production
```

### 2. Configuration AWS Cognito

#### Créer un User Pool

1. Connectez-vous à la console AWS Cognito
2. Créez un nouveau User Pool
3. Configuration recommandée :
   - **Sign-in options** : Email
   - **Password policy** : Custom (min 8 caractères, majuscule, minuscule, chiffre, caractère spécial)
   - **MFA** : Optional (recommandé)
   - **Email provider** : Cognito (ou SES pour la production)

#### Créer un App Client

1. Dans votre User Pool, créez un App Client
2. Configuration :
   - **App type** : Confidential client
   - **Authentication flows** : 
     - ✅ ALLOW_USER_PASSWORD_AUTH
     - ✅ ALLOW_REFRESH_TOKEN_AUTH
   - **Generate client secret** : ✅ Oui
   - **Token expiration** :
     - Access token : 1 heure
     - ID token : 1 heure
     - Refresh token : 30 jours

3. Notez les valeurs suivantes :
   - User Pool ID
   - App Client ID
   - App Client Secret

---

## 🗄️ Base de données

### Option 1 : Synchronisation automatique (Développement uniquement)

Si vous êtes en développement, TypeORM peut synchroniser automatiquement le schéma :

```typescript
// app.module.ts
TypeOrmModule.forRoot({
  // ...
  synchronize: true, // ⚠️ UNIQUEMENT EN DÉVELOPPEMENT
})
```

### Option 2 : Migrations manuelles (Production)

Pour la production, exécutez les migrations SQL suivantes :

```sql
-- Vérifier si les colonnes existent déjà
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'users';

-- Ajout de colonnes à la table users (si elles n'existent pas)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS username VARCHAR(255),
ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;

-- Ajout de colonnes à la table partitions (si elles n'existent pas)
ALTER TABLE partitions 
ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Création de la table favorites (si elle n'existe pas)
CREATE TABLE IF NOT EXISTS favorites (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  partition_id INTEGER NOT NULL REFERENCES partitions(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_partition UNIQUE(user_id, partition_id)
);

-- Création des index pour les performances
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_partition ON favorites(partition_id);
CREATE INDEX IF NOT EXISTS idx_partitions_is_public ON partitions(is_public);
CREATE INDEX IF NOT EXISTS idx_partitions_download_count ON partitions(download_count DESC);
CREATE INDEX IF NOT EXISTS idx_users_cognito_sub ON users(cognito_sub);
```

---

## 📦 Installation des dépendances

```bash
# Installer les dépendances
npm install

# Vérifier que toutes les dépendances AWS SDK sont installées
npm list @aws-sdk/client-cognito-identity-provider
npm list @aws-sdk/client-s3
```

Si des dépendances manquent :

```bash
npm install @aws-sdk/client-cognito-identity-provider @aws-sdk/client-s3
```

---

## 🧪 Tests avant déploiement

### 1. Tests unitaires

```bash
# Lancer tous les tests
npm run test

# Tests avec couverture
npm run test:cov
```

### 2. Tests d'intégration

Utilisez le fichier `test-features.http` avec l'extension REST Client de VS Code :

1. Ouvrez `test-features.http`
2. Mettez à jour `@baseUrl` avec votre URL de développement
3. Testez chaque route une par une

### 3. Tests manuels essentiels

```bash
# 1. Inscription
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "name": "Test User"
  }'

# 2. Vérifier que l'email de confirmation a été envoyé
# (Vérifiez les logs ou votre boîte email)

# 3. Confirmer l'inscription
curl -X POST http://localhost:3000/auth/confirm-signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "code": "123456"
  }'

# 4. Connexion
curl -X POST http://localhost:3000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'

# 5. Tester une route protégée
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 🚀 Déploiement

### 1. Build de l'application

```bash
# Build pour la production
npm run build

# Vérifier que le build s'est bien passé
ls -la dist/
```

### 2. Démarrage en production

```bash
# Démarrer l'application
npm run start:prod

# Ou avec PM2 (recommandé)
pm2 start dist/main.js --name clefcloud-api
pm2 save
pm2 startup
```

### 3. Vérification du déploiement

```bash
# Health check
curl http://localhost:3000/health

# Vérifier la base de données
curl http://localhost:3000/health/db

# Vérifier la documentation Swagger
curl http://localhost:3000/api
```

---

## 🔒 Sécurité en production

### 1. Variables d'environnement

- ❌ Ne jamais commiter le fichier `.env`
- ✅ Utiliser un gestionnaire de secrets (AWS Secrets Manager, HashiCorp Vault)
- ✅ Utiliser des IAM roles sur AWS au lieu de clés d'accès

### 2. HTTPS

```bash
# Configurer un reverse proxy avec Nginx
sudo apt install nginx

# Configuration Nginx pour HTTPS
sudo nano /etc/nginx/sites-available/clefcloud
```

Exemple de configuration Nginx :

```nginx
server {
    listen 80;
    server_name api.clefcloud.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.clefcloud.com;

    ssl_certificate /etc/letsencrypt/live/api.clefcloud.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.clefcloud.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. Rate Limiting

Installez et configurez le rate limiting :

```bash
npm install @nestjs/throttler
```

```typescript
// app.module.ts
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 10,
    }),
    // ...
  ],
})
```

### 4. CORS

```typescript
// main.ts
app.enableCors({
  origin: ['https://clefcloud.com', 'https://www.clefcloud.com'],
  credentials: true,
});
```

---

## 📊 Monitoring

### 1. Logs

```bash
# Voir les logs en temps réel
pm2 logs clefcloud-api

# Logs des dernières 24h
pm2 logs clefcloud-api --lines 1000
```

### 2. Monitoring avec PM2

```bash
# Dashboard PM2
pm2 monit

# Statistiques
pm2 status
```

### 3. Alertes

Configurez des alertes pour :
- Erreurs d'authentification répétées
- Tentatives de connexion échouées
- Suppressions de compte
- Erreurs 500

---

## 🔄 Mise à jour

### Déploiement d'une nouvelle version

```bash
# 1. Pull les derniers changements
git pull origin main

# 2. Installer les nouvelles dépendances
npm install

# 3. Build
npm run build

# 4. Redémarrer l'application
pm2 restart clefcloud-api

# 5. Vérifier que tout fonctionne
pm2 logs clefcloud-api --lines 50
```

### Rollback en cas de problème

```bash
# Revenir à la version précédente
git checkout <previous-commit>
npm install
npm run build
pm2 restart clefcloud-api
```

---

## 📝 Checklist de déploiement

### Avant le déploiement

- [ ] Toutes les variables d'environnement sont configurées
- [ ] Les credentials AWS Cognito sont valides
- [ ] La base de données est accessible
- [ ] Les migrations sont prêtes
- [ ] Les tests passent
- [ ] Le build fonctionne

### Pendant le déploiement

- [ ] Exécuter les migrations de base de données
- [ ] Déployer le nouveau code
- [ ] Redémarrer l'application
- [ ] Vérifier les logs

### Après le déploiement

- [ ] Tester les routes d'authentification
- [ ] Vérifier la documentation Swagger
- [ ] Tester une inscription complète
- [ ] Tester une connexion
- [ ] Vérifier les emails
- [ ] Monitorer les erreurs pendant 1h

---

## 🐛 Dépannage

### L'application ne démarre pas

```bash
# Vérifier les logs
pm2 logs clefcloud-api --err

# Vérifier les variables d'environnement
pm2 env 0

# Redémarrer en mode debug
NODE_ENV=development npm run start
```

### Erreurs de connexion à la base de données

```bash
# Tester la connexion
psql -h localhost -U postgres -d clefcloud

# Vérifier les credentials dans .env
cat .env | grep DATABASE
```

### Erreurs Cognito

```bash
# Vérifier les credentials
aws cognito-idp describe-user-pool --user-pool-id YOUR_POOL_ID

# Tester l'authentification
aws cognito-idp admin-initiate-auth --user-pool-id YOUR_POOL_ID --client-id YOUR_CLIENT_ID
```

---

## 📞 Support

En cas de problème :

1. Consultez les logs : `pm2 logs clefcloud-api`
2. Vérifiez la documentation : `src/auth/README.md`
3. Testez avec `test-features.http`
4. Consultez la documentation AWS Cognito

---

## 🎉 Félicitations !

Votre application ClefCloud est maintenant déployée avec un système d'authentification complet et sécurisé ! 🚀

**Prochaines étapes recommandées** :
- Configurer le monitoring avancé
- Mettre en place des sauvegardes automatiques
- Implémenter le MFA
- Ajouter des analytics
