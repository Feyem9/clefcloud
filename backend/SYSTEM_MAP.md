# 🗺️ MAP COMPLET - Système de Vérification Cognito

## 📊 État Actuel du Système

### ✅ Composants Fonctionnels

| Composant | État | Port/URL | Notes |
|-----------|------|----------|-------|
| **RabbitMQ** | ✅ ACTIF | 5672, 15672 | Installé localement |
| **Lambda AWS** | ✅ DÉPLOYÉE | us-east-1 | CognitoCustomMessage |
| **PostgreSQL** | ✅ ACTIF | RDS AWS | Table créée |
| **Backend NestJS** | ⚠️ EN CONFIG | 3000 | Synchronize désactivé |

---

## 🏗️ Architecture Complète

```
┌─────────────────────────────────────────────────────────────────┐
│                     FLUX DE VÉRIFICATION                        │
└─────────────────────────────────────────────────────────────────┘

1. UTILISATEUR
   └─> Inscription/Mot de passe oublié
       │
       ▼
2. AWS COGNITO (us-east-1_dl0kSgKUl)
   └─> Génère code de vérification (ex: 123456)
       │
       ▼
3. LAMBDA TRIGGER (CognitoCustomMessage)
   ├─> Intercepte le code
   ├─> Log dans CloudWatch
   └─> Envoie à RabbitMQ
       │
       ▼
4. RABBITMQ (localhost:5672)
   ├─> Queue: cognito-verification-codes
   └─> Stocke temporairement
       │
       ▼
5. BACKEND NESTJS (localhost:3000)
   ├─> Consumer RabbitMQ
   ├─> Sauvegarde PostgreSQL
   └─> Envoie email (SES/SendGrid)
       │
       ▼
6. POSTGRESQL (RDS AWS)
   ├─> Table: verification_codes
   ├─> Vue: verification_stats
   └─> Audit complet
       │
       ▼
7. EMAIL (SES/SendGrid)
   └─> Utilisateur reçoit le code
```

---

## 📁 Structure des Fichiers

### Backend NestJS
```
src/verification/
├── entities/
│   └── verification-code.entity.ts    # Entity TypeORM
├── verification.module.ts             # Module NestJS
├── verification.service.ts            # Service métier
├── verification.controller.ts         # API REST
├── rabbitmq.consumer.ts               # Consumer RabbitMQ
└── email.service.ts                   # Service email
```

### Lambda AWS
```
lambda/cognito-custom-message/
├── index.js                           # Handler Lambda
├── package.json                       # Dépendances
├── deploy.sh                          # Script déploiement
├── test-local.js                      # Tests locaux
└── function.zip                       # Package (14M)
```

### Migrations
```
migrations/
├── 001_create_verification_codes_table.sql
└── apply-migration.sh
```

### Documentation
```
├── VERIFICATION_README.md             # README principal
├── COGNITO_VERIFICATION_COMPLETE_GUIDE.md
├── VERIFICATION_QUICK_START.md
├── VERIFICATION_SYSTEM_GUIDE.md
├── VERIFICATION_SYSTEM_SUMMARY.md
├── COMMANDS_CHEATSHEET.md
└── SYSTEM_MAP.md                      # Ce fichier
```

---

## 🔧 Configuration

### Variables d'environnement (.env)

```env
# RabbitMQ
RABBITMQ_URL=amqp://localhost:5672

# Email
EMAIL_PROVIDER=SES
FROM_EMAIL=noreply@clefcloud.com

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=****************VU4P
AWS_SECRET_ACCESS_KEY=****************iGZc

# PostgreSQL
RDS_ENDPOINT=clefcloud.cqtea40yk74r.us-east-1.rds.amazonaws.com:5432
DB_NAME=clefcloud
DB_USERNAME=postgres
DB_PASSWORD=********

# Cognito
COGNITO_USER_POOL_ID=us-east-1_dl0kSgKUl
COGNITO_CLIENT_ID=2pu1v5mpa5eht36m8im2ns40sf
```

---

## 🎯 Endpoints API

### Base URL: `http://localhost:3000/api/verification`

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/` | Liste des codes | ✅ |
| GET | `/stats` | Statistiques | ✅ |
| GET | `/email/:email` | Codes par email | ✅ |
| GET | `/:id` | Détails d'un code | ✅ |
| POST | `/:id/mark-used` | Marquer utilisé | ✅ |
| POST | `/:id/retry` | Réessayer envoi | ✅ |
| POST | `/cleanup` | Nettoyer expirés | ✅ |

---

## 🗄️ Schéma PostgreSQL

### Table: verification_codes

```sql
CREATE TABLE verification_codes (
  id UUID PRIMARY KEY,
  user_id VARCHAR(255),
  user_pool_id VARCHAR(255),
  email VARCHAR(255),
  verification_code VARCHAR(10),
  event_type verification_event_type,  -- SIGNUP, FORGOT_PASSWORD, etc.
  status verification_status,          -- PENDING, SENT, FAILED, etc.
  created_at TIMESTAMP,
  expires_at TIMESTAMP,
  email_sent_at TIMESTAMP,
  used_at TIMESTAMP,
  ...
);
```

### Vue: verification_stats

```sql
CREATE VIEW verification_stats AS
SELECT 
  event_type,
  status,
  COUNT(*) as total,
  ...
FROM verification_codes
GROUP BY event_type, status;
```

---

## 🧪 Tests

### 1. Test Lambda directement

```bash
aws lambda invoke \
  --function-name CognitoCustomMessage \
  --cli-binary-format raw-in-base64-out \
  --payload file:///tmp/test-lambda.json \
  --region us-east-1 \
  /tmp/output.json
```

### 2. Test RabbitMQ directement

```bash
node test-rabbitmq-direct.js
```

### 3. Test Backend API

```bash
curl http://localhost:3000/api/verification/stats
```

### 4. Test complet (inscription)

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!"}'
```

---

## ⚠️ Problèmes Identifiés

### 1. Lambda → RabbitMQ
- ❌ Lambda ne peut pas accéder à RabbitMQ local (localhost)
- **Solutions**:
  - Option A: Utiliser Amazon MQ (RabbitMQ managé)
  - Option B: Exposer RabbitMQ avec ngrok (test uniquement)
  - Option C: Déployer RabbitMQ sur EC2

### 2. TypeORM Synchronize
- ❌ Conflit avec la vue `verification_stats`
- ✅ **Résolu**: `synchronize: false` dans app.module.ts

### 3. Backend Consumer
- ⚠️ Consumer ne démarre pas automatiquement
- **À vérifier**: Logs du backend au démarrage

---

## 📋 Checklist de Déploiement

### Phase 1: Développement Local ✅
- [x] Lambda créée et déployée
- [x] RabbitMQ installé et actif
- [x] PostgreSQL configuré
- [x] Table et vue créées
- [x] Backend NestJS codé
- [x] Documentation complète

### Phase 2: Tests Locaux ⏳
- [x] Test Lambda → CloudWatch
- [x] Test RabbitMQ direct
- [ ] Test Backend Consumer
- [ ] Test Email SES
- [ ] Test complet end-to-end

### Phase 3: Production 🔜
- [ ] Migrer vers Amazon MQ
- [ ] Configurer VPC/Security Groups
- [ ] Activer SSL/TLS
- [ ] Configurer CloudWatch Alarms
- [ ] Tests de charge
- [ ] Documentation ops

---

## 🚀 Prochaines Étapes

1. **Démarrer le backend** avec succès
2. **Vérifier le consumer RabbitMQ** fonctionne
3. **Tester l'envoi d'email** via SES
4. **Migrer vers Amazon MQ** pour production
5. **Configurer le monitoring** CloudWatch

---

## 📞 Support

- **Logs Lambda**: `aws logs tail /aws/lambda/CognitoCustomMessage --follow`
- **Logs Backend**: Vérifier le terminal npm
- **RabbitMQ UI**: http://localhost:15672 (admin/admin123)
- **PostgreSQL**: `psql -h clefcloud...rds.amazonaws.com -U postgres -d clefcloud`

---

**Dernière mise à jour**: 2025-10-16 15:37  
**Version**: 1.0.0  
**Statut**: En configuration ⚙️
