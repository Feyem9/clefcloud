# 🔐 Système de Vérification Cognito - ClefCloud

> **Interceptez et gérez les codes de vérification AWS Cognito avec Lambda, RabbitMQ, NestJS, PostgreSQL et SES/SendGrid**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/nestjs-10.x-red.svg)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/typescript-5.x-blue.svg)](https://www.typescriptlang.org/)

---

## 📋 Vue d'ensemble

Ce système permet d'**intercepter automatiquement** tous les codes de vérification générés par AWS Cognito (inscription, mot de passe oublié, etc.) et de les gérer via votre propre infrastructure.

### ✨ Fonctionnalités principales

- ✅ **Interception complète** - Capture tous les codes Cognito via Lambda Triggers
- ✅ **Stockage audit** - PostgreSQL avec historique complet
- ✅ **File d'attente** - RabbitMQ pour traitement asynchrone et résilient
- ✅ **Envoi personnalisé** - Templates HTML via AWS SES ou SendGrid
- ✅ **Retry automatique** - Jusqu'à 3 tentatives en cas d'échec
- ✅ **API REST** - Interface d'administration complète
- ✅ **Monitoring** - CloudWatch Logs + Statistiques PostgreSQL
- ✅ **Scalable** - Architecture distribuée et horizontalement scalable

---

## 🏗️ Architecture

```
AWS Cognito → Lambda → RabbitMQ → NestJS → PostgreSQL
                ↓                     ↓
          CloudWatch              SES/SendGrid
                                      ↓
                                    Email
```

### Composants

| Composant | Rôle | Technologie |
|-----------|------|-------------|
| **Lambda** | Intercepteur | Node.js 18, AWS Lambda |
| **RabbitMQ** | File d'attente | RabbitMQ 3.12 |
| **Backend** | Traitement | NestJS 10, TypeScript |
| **Database** | Stockage | PostgreSQL 14+ |
| **Email** | Envoi | AWS SES ou SendGrid |
| **Logs** | Monitoring | CloudWatch Logs |

---

## 🚀 Installation rapide

### Prérequis

- Node.js 18+
- Docker (pour RabbitMQ)
- PostgreSQL 14+
- AWS CLI configuré
- Compte AWS avec Cognito

### Installation en 1 commande

```bash
./install-verification-system.sh
```

### Installation manuelle

```bash
# 1. Installer les dépendances
npm install
cd lambda/cognito-custom-message && npm install && cd ../..

# 2. Démarrer RabbitMQ
docker-compose -f docker-compose.rabbitmq.yml up -d

# 3. Créer la base de données
cd migrations && ./apply-migration.sh && cd ..

# 4. Configurer .env
cp .env.example .env
# Éditez .env avec vos credentials

# 5. Démarrer le backend
npm run start:dev

# 6. Déployer la Lambda
cd lambda/cognito-custom-message && ./deploy.sh create
```

---

## ⚙️ Configuration

### Variables d'environnement (.env)

```env
# RabbitMQ
RABBITMQ_URL=amqp://admin:admin123@localhost:5672

# Email Provider (SES ou SendGrid)
EMAIL_PROVIDER=SES
FROM_EMAIL=noreply@clefcloud.com

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret

# PostgreSQL
RDS_ENDPOINT=your-db:5432
DB_NAME=clefcloud
DB_USERNAME=admin
DB_PASSWORD=password

# Cognito
COGNITO_USER_POOL_ID=us-east-1_dl0kSgKUl
COGNITO_CLIENT_ID=2pu1v5mpa5eht36m8im2ns40sf
```

---

## 🧪 Test

### Test rapide

```bash
# 1. Créer un compte
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!","firstName":"Test","lastName":"User"}'

# 2. Vérifier RabbitMQ
open http://localhost:15672  # admin/admin123

# 3. Vérifier PostgreSQL
psql -h $DB_HOST -U $DB_USER -d $DB_NAME \
  -c "SELECT email, verification_code, status FROM verification_codes ORDER BY created_at DESC LIMIT 1;"

# 4. Vérifier l'email dans votre boîte de réception
```

---

## 📊 API Endpoints

### Base URL
```
http://localhost:3000/api/verification
```

### Endpoints disponibles

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/` | Liste tous les codes |
| GET | `/stats` | Statistiques globales |
| GET | `/email/:email` | Codes pour un email |
| GET | `/:id` | Détails d'un code |
| POST | `/:id/mark-used` | Marquer comme utilisé |
| POST | `/:id/retry` | Réessayer l'envoi |
| POST | `/cleanup` | Nettoyer les codes expirés |

### Exemples

```bash
# Statistiques
curl http://localhost:3000/api/verification/stats

# Codes d'un utilisateur
curl http://localhost:3000/api/verification/email/test@example.com

# Réessayer un envoi échoué
curl -X POST http://localhost:3000/api/verification/{id}/retry
```

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [COGNITO_VERIFICATION_COMPLETE_GUIDE.md](./COGNITO_VERIFICATION_COMPLETE_GUIDE.md) | Guide complet (10+ pages) |
| [VERIFICATION_QUICK_START.md](./VERIFICATION_QUICK_START.md) | Démarrage rapide (5 min) |
| [VERIFICATION_SYSTEM_GUIDE.md](./VERIFICATION_SYSTEM_GUIDE.md) | Guide technique détaillé |
| [VERIFICATION_SYSTEM_SUMMARY.md](./VERIFICATION_SYSTEM_SUMMARY.md) | Résumé du système |
| [COMMANDS_CHEATSHEET.md](./COMMANDS_CHEATSHEET.md) | Commandes utiles |

---

## 🔧 Commandes essentielles

### Backend

```bash
npm run start:dev      # Démarrer en mode développement
npm run build          # Build pour production
npm run start:prod     # Démarrer en production
```

### RabbitMQ

```bash
docker-compose -f docker-compose.rabbitmq.yml up -d    # Démarrer
docker-compose -f docker-compose.rabbitmq.yml down     # Arrêter
open http://localhost:15672                            # Management UI
```

### Lambda

```bash
cd lambda/cognito-custom-message
./deploy.sh create     # Première fois
./deploy.sh update     # Mise à jour
node test-local.js     # Test local
```

### PostgreSQL

```bash
cd migrations
./apply-migration.sh   # Appliquer la migration

# Requêtes utiles
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT * FROM verification_codes ORDER BY created_at DESC LIMIT 10;"
```

---

## 📈 Monitoring

### RabbitMQ Management
- **URL**: http://localhost:15672
- **Login**: admin / admin123
- **Queue**: `cognito-verification-codes`

### CloudWatch Logs
```bash
aws logs tail /aws/lambda/cognito-verification-codes --follow
```

### PostgreSQL Stats
```sql
SELECT * FROM verification_stats;
```

---

## 🐛 Troubleshooting

### Problème: Lambda ne reçoit pas les événements

```bash
# Vérifier le trigger
aws cognito-idp describe-user-pool \
  --user-pool-id us-east-1_dl0kSgKUl \
  --query 'UserPool.LambdaConfig'

# Reconfigurer
cd lambda/cognito-custom-message && ./deploy.sh create
```

### Problème: RabbitMQ ne reçoit pas les messages

```bash
# Vérifier les logs Lambda
aws logs tail /aws/lambda/CognitoCustomMessage --follow

# Vérifier la connexion
telnet localhost 5672
```

### Problème: Emails non envoyés

```bash
# Vérifier SES
aws ses get-account-sending-enabled
aws ses list-verified-email-addresses

# Réessayer manuellement
curl -X POST http://localhost:3000/api/verification/{id}/retry
```

---

## 📊 Structure du projet

```
backend/
├── src/
│   └── verification/
│       ├── entities/
│       │   └── verification-code.entity.ts
│       ├── verification.module.ts
│       ├── verification.service.ts
│       ├── verification.controller.ts
│       ├── rabbitmq.consumer.ts
│       └── email.service.ts
├── lambda/
│   └── cognito-custom-message/
│       ├── index.js
│       ├── package.json
│       ├── deploy.sh
│       └── test-local.js
├── migrations/
│   ├── 001_create_verification_codes_table.sql
│   └── apply-migration.sh
├── docker-compose.rabbitmq.yml
├── install-verification-system.sh
└── Documentation/
    ├── COGNITO_VERIFICATION_COMPLETE_GUIDE.md
    ├── VERIFICATION_QUICK_START.md
    ├── VERIFICATION_SYSTEM_GUIDE.md
    ├── VERIFICATION_SYSTEM_SUMMARY.md
    └── COMMANDS_CHEATSHEET.md
```

---

## 🎯 Cas d'usage

### 1. Inscription (SIGNUP)
- Code valide 24 heures
- Email de bienvenue personnalisé
- Stockage en base pour audit

### 2. Mot de passe oublié (FORGOT_PASSWORD)
- Code valide 1 heure
- Email de réinitialisation
- Tracking des tentatives

### 3. Renvoi du code (RESEND_CODE)
- Nouveau code généré
- Invalidation de l'ancien
- Limite de 3 tentatives

---

## 🔐 Sécurité

- ✅ Codes stockés en base (audit complet)
- ✅ Expiration automatique
- ✅ Limitation des tentatives
- ✅ Logs CloudWatch sécurisés
- ✅ API protégée par JWT
- ⚠️ En production: chiffrer les codes en base

---

## 📈 Performance

| Métrique | Valeur |
|----------|--------|
| Lambda | Scale automatique |
| RabbitMQ | ~10,000 msg/s |
| PostgreSQL | ~1,000 req/s |
| SES | 14 emails/s (sandbox), illimité (prod) |

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Consultez [CONTRIBUTING.md](CONTRIBUTING.md) pour les guidelines.

---

## 📝 License

MIT License - voir [LICENSE](LICENSE) pour plus de détails.

---

## 🆘 Support

- 📧 Email: support@clefcloud.com
- 📚 Documentation: [Guides complets](./COGNITO_VERIFICATION_COMPLETE_GUIDE.md)
- 🐛 Issues: [GitHub Issues](https://github.com/clefcloud/verification-system/issues)

---

## 🎉 Remerciements

Créé avec ❤️ par l'équipe **ClefCloud** 🎵

**Technologies utilisées:**
- [NestJS](https://nestjs.com/)
- [AWS Lambda](https://aws.amazon.com/lambda/)
- [RabbitMQ](https://www.rabbitmq.com/)
- [PostgreSQL](https://www.postgresql.org/)
- [TypeORM](https://typeorm.io/)
- [AWS SES](https://aws.amazon.com/ses/)

---

**Version:** 1.0.0  
**Dernière mise à jour:** 2025-10-16  
**Statut:** ✅ Production Ready
