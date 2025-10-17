# 🔐 Guide Complet - Système de Vérification Cognito

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Déploiement](#déploiement)
6. [Utilisation](#utilisation)
7. [API Documentation](#api-documentation)
8. [Monitoring](#monitoring)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Vue d'ensemble

Ce système intercepte les codes de vérification AWS Cognito et les gère via une architecture moderne et scalable.

### Fonctionnalités

✅ **Interception des codes** - Lambda capture tous les codes Cognito
✅ **Stockage PostgreSQL** - Audit complet et traçabilité
✅ **File d'attente RabbitMQ** - Traitement asynchrone et résilient
✅ **Envoi personnalisé** - AWS SES ou SendGrid
✅ **Logs CloudWatch** - Monitoring et debugging
✅ **API REST** - Interface d'administration
✅ **Retry automatique** - En cas d'échec d'envoi
✅ **Statistiques** - Dashboard en temps réel

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        AWS COGNITO                              │
│  (Génère les codes de vérification)                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ CustomMessage Trigger
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     AWS LAMBDA                                  │
│  • Intercepte le code                                          │
│  • Log dans CloudWatch                                         │
│  • Envoie à RabbitMQ                                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ AMQP Message
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      RABBITMQ                                   │
│  • Queue: cognito-verification-codes                           │
│  • Durable: true                                               │
│  • TTL: 1 heure                                                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Consumer
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   NESTJS BACKEND                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ RabbitMQ Consumer                                        │  │
│  │  • Écoute la queue                                       │  │
│  │  • Traite les messages                                   │  │
│  └───────────────────┬──────────────────────────────────────┘  │
│                      │                                          │
│                      ▼                                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Verification Service                                     │  │
│  │  • Sauvegarde en base                                    │  │
│  │  • Envoie l'email                                        │  │
│  └───────────────────┬──────────────────────────────────────┘  │
│                      │                                          │
│         ┌────────────┴────────────┐                            │
│         ▼                         ▼                            │
│  ┌─────────────┐          ┌─────────────┐                     │
│  │ PostgreSQL  │          │ Email       │                     │
│  │ (Audit)     │          │ Service     │                     │
│  └─────────────┘          └──────┬──────┘                     │
│                                   │                            │
└───────────────────────────────────┼────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
            ┌───────────────┐             ┌───────────────┐
            │   AWS SES     │             │   SendGrid    │
            └───────┬───────┘             └───────┬───────┘
                    │                             │
                    └──────────┬──────────────────┘
                               ▼
                        ┌─────────────┐
                        │    Email    │
                        │    User     │
                        └─────────────┘
```

---

## 🚀 Installation

### Prérequis

- Node.js 18+
- PostgreSQL 14+
- RabbitMQ 3.12+
- AWS CLI configuré
- Docker (optionnel)

### 1. Cloner le projet

```bash
cd /home/christian/Bureau/CHRISTIAN/ClefCloud/backend
```

### 2. Installer les dépendances

```bash
# Backend NestJS
npm install

# Lambda
cd lambda/cognito-custom-message
npm install
cd ../..
```

### 3. Démarrer RabbitMQ

**Option A : Docker (Recommandé)**

```bash
docker-compose -f docker-compose.rabbitmq.yml up -d
```

**Option B : Installation locale**

```bash
# Ubuntu/Debian
sudo apt-get install rabbitmq-server
sudo systemctl start rabbitmq-server
sudo rabbitmq-plugins enable rabbitmq_management

# macOS
brew install rabbitmq
brew services start rabbitmq
```

Accès Management UI : http://localhost:15672 (admin/admin123)

### 4. Créer la base de données PostgreSQL

```bash
# Appliquer la migration
cd migrations
./apply-migration.sh
```

---

## ⚙️ Configuration

### Variables d'environnement (.env)

```env
# Node Environment
NODE_ENV=development
PORT=3000

# PostgreSQL
RDS_ENDPOINT=your-db-host:5432
DB_NAME=clefcloud
DB_USERNAME=clefcloud_admin
DB_PASSWORD=your_password

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# Cognito
COGNITO_USER_POOL_ID=us-east-1_dl0kSgKUl
COGNITO_CLIENT_ID=2pu1v5mpa5eht36m8im2ns40sf
COGNITO_CLIENT_SECRET=your_client_secret

# RabbitMQ
RABBITMQ_URL=amqp://admin:admin123@localhost:5672

# Email Provider (SES ou SendGrid)
EMAIL_PROVIDER=SES
FROM_EMAIL=noreply@clefcloud.com

# SendGrid (si EMAIL_PROVIDER=SendGrid)
# SENDGRID_API_KEY=your_sendgrid_api_key
```

---

## 📦 Déploiement

### Étape 1 : Déployer la Lambda

```bash
cd lambda/cognito-custom-message

# Première fois (création)
./deploy.sh create

# Mises à jour ultérieures
./deploy.sh update
```

### Étape 2 : Vérifier la configuration Cognito

```bash
# Vérifier que le trigger est configuré
aws cognito-idp describe-user-pool \
  --user-pool-id us-east-1_dl0kSgKUl \
  --region us-east-1 \
  --query 'UserPool.LambdaConfig'
```

Vous devriez voir :

```json
{
  "CustomMessage": "arn:aws:lambda:us-east-1:YOUR_ACCOUNT:function:CognitoCustomMessage"
}
```

### Étape 3 : Démarrer le backend

```bash
cd /home/christian/Bureau/CHRISTIAN/ClefCloud/backend
npm run start:dev
```

Vérifiez les logs :

```
🐰 Connexion à RabbitMQ: amqp://localhost:5672
✅ Connecté à RabbitMQ - Queue: cognito-verification-codes
👂 Écoute de la queue: cognito-verification-codes
📧 Email provider: AWS SES
```

---

## 🧪 Test du système

### Test 1 : Lambda localement

```bash
cd lambda/cognito-custom-message
node test-local.js
```

### Test 2 : Flux complet

1. **Créer un compte** sur votre application

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!",
    "firstName": "Test",
    "lastName": "User"
  }'
```

2. **Vérifier RabbitMQ**

- Allez sur http://localhost:15672
- Login: admin / admin123
- Vérifiez la queue `cognito-verification-codes`

3. **Vérifier PostgreSQL**

```sql
SELECT 
  email, 
  verification_code, 
  event_type, 
  status, 
  created_at 
FROM verification_codes 
ORDER BY created_at DESC 
LIMIT 10;
```

4. **Vérifier l'email**

Consultez votre boîte de réception (ou spam)

5. **Vérifier les logs CloudWatch**

```bash
aws logs tail /aws/lambda/cognito-verification-codes --follow
```

---

## 📊 API Documentation

### Base URL

```
http://localhost:3000/api/verification
```

### Endpoints

#### 1. Liste tous les codes

```http
GET /api/verification?limit=50&offset=0&status=SENT&email=test@example.com
```

**Query Parameters:**
- `limit` (number): Nombre de résultats (défaut: 50)
- `offset` (number): Pagination (défaut: 0)
- `status` (enum): PENDING, SENT, FAILED, EXPIRED, USED
- `eventType` (enum): SIGNUP, FORGOT_PASSWORD, RESEND_CODE
- `email` (string): Filtrer par email

**Response:**

```json
{
  "items": [
    {
      "id": "uuid",
      "email": "test@example.com",
      "verificationCode": "123456",
      "eventType": "SIGNUP",
      "status": "SENT",
      "emailSentAt": "2025-10-16T10:30:00Z",
      "expiresAt": "2025-10-17T10:30:00Z",
      "createdAt": "2025-10-16T10:29:45Z"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

#### 2. Statistiques

```http
GET /api/verification/stats
```

**Response:**

```json
{
  "total": 150,
  "byStatus": {
    "pending": 5,
    "sent": 120,
    "failed": 10,
    "expired": 10,
    "used": 5
  },
  "last24h": 45
}
```

#### 3. Codes pour un email

```http
GET /api/verification/email/test@example.com
```

#### 4. Détails d'un code

```http
GET /api/verification/:id
```

#### 5. Marquer comme utilisé

```http
POST /api/verification/:id/mark-used
Content-Type: application/json

{
  "ipAddress": "192.168.1.1"
}
```

#### 6. Réessayer l'envoi

```http
POST /api/verification/:id/retry
```

#### 7. Nettoyer les codes expirés

```http
POST /api/verification/cleanup
```

---

## 📈 Monitoring

### CloudWatch Logs

**Logs Lambda:**
- `/aws/lambda/cognito-verification-codes/SIGNUP-2025-10-16`
- `/aws/lambda/cognito-verification-codes/FORGOT_PASSWORD-2025-10-16`
- `/aws/lambda/cognito-verification-codes/errors-2025-10-16`

**Commandes utiles:**

```bash
# Suivre les logs en temps réel
aws logs tail /aws/lambda/cognito-verification-codes --follow

# Rechercher un email spécifique
aws logs filter-pattern /aws/lambda/cognito-verification-codes \
  --filter-pattern "test@example.com" \
  --start-time $(date -u -d '1 hour ago' +%s)000
```

### RabbitMQ Management

**URL:** http://localhost:15672

**Métriques à surveiller:**
- Nombre de messages dans la queue
- Taux de consommation
- Messages non acquittés
- Erreurs de connexion

### PostgreSQL Queries

```sql
-- Statistiques par type et statut
SELECT event_type, status, COUNT(*) as count
FROM verification_codes
GROUP BY event_type, status
ORDER BY event_type, status;

-- Codes des dernières 24h
SELECT COUNT(*) as count_24h
FROM verification_codes
WHERE created_at > NOW() - INTERVAL '24 hours';

-- Taux de succès d'envoi
SELECT 
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'SENT') / COUNT(*), 2) as success_rate
FROM verification_codes
WHERE created_at > NOW() - INTERVAL '24 hours';

-- Temps moyen de traitement
SELECT 
  AVG(EXTRACT(EPOCH FROM (email_sent_at - created_at))) as avg_seconds
FROM verification_codes
WHERE email_sent_at IS NOT NULL;
```

---

## 🔧 Troubleshooting

### Problème 1 : Lambda ne reçoit pas les événements

**Symptômes:** Aucun log dans CloudWatch

**Solutions:**

1. Vérifier les permissions IAM
```bash
aws lambda get-policy --function-name CognitoCustomMessage
```

2. Vérifier le trigger Cognito
```bash
aws cognito-idp describe-user-pool \
  --user-pool-id us-east-1_dl0kSgKUl \
  --query 'UserPool.LambdaConfig'
```

3. Tester manuellement
```bash
aws lambda invoke \
  --function-name CognitoCustomMessage \
  --payload file://test-event.json \
  output.json
```

### Problème 2 : RabbitMQ ne reçoit pas les messages

**Symptômes:** Queue vide dans RabbitMQ Management

**Solutions:**

1. Vérifier la connexion réseau
```bash
telnet localhost 5672
```

2. Vérifier les logs Lambda
```bash
aws logs tail /aws/lambda/CognitoCustomMessage --follow
```

3. Vérifier les credentials RabbitMQ dans Lambda

### Problème 3 : Emails non envoyés

**Symptômes:** Status FAILED dans PostgreSQL

**Solutions:**

1. Vérifier SES sandbox mode
```bash
aws ses get-account-sending-enabled
```

2. Vérifier l'email vérifié
```bash
aws ses list-verified-email-addresses
```

3. Consulter les logs backend
```bash
npm run start:dev
# Regarder les logs du EmailService
```

4. Réessayer manuellement
```bash
curl -X POST http://localhost:3000/api/verification/{id}/retry
```

### Problème 4 : Backend ne consomme pas RabbitMQ

**Symptômes:** Messages s'accumulent dans la queue

**Solutions:**

1. Vérifier que le backend est démarré
```bash
ps aux | grep node
```

2. Vérifier les logs de connexion
```
🐰 Connexion à RabbitMQ...
✅ Connecté à RabbitMQ
```

3. Redémarrer le backend
```bash
npm run start:dev
```

---

## 📝 Maintenance

### Nettoyage automatique des codes expirés

Ajoutez un cron job dans NestJS :

```typescript
// src/verification/verification.cron.ts
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { VerificationService } from './verification.service';

@Injectable()
export class VerificationCron {
  constructor(private readonly verificationService: VerificationService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpired() {
    await this.verificationService.cleanupExpired();
  }
}
```

### Backup PostgreSQL

```bash
# Backup
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME -t verification_codes > backup.sql

# Restore
psql -h $DB_HOST -U $DB_USER -d $DB_NAME < backup.sql
```

---

## 🎯 Bonnes pratiques

✅ **Sécurité**
- Ne jamais exposer les codes dans les logs publics
- Limiter l'accès à l'API admin
- Utiliser HTTPS en production
- Chiffrer les données sensibles

✅ **Performance**
- Index PostgreSQL bien configurés
- RabbitMQ prefetch limité à 10
- Lambda timeout à 30s max
- Cleanup régulier des codes expirés

✅ **Monitoring**
- Alertes CloudWatch sur les erreurs
- Dashboard RabbitMQ
- Métriques PostgreSQL
- Logs centralisés

✅ **Scalabilité**
- Lambda scale automatiquement
- RabbitMQ peut gérer des milliers de msg/s
- PostgreSQL avec read replicas si nécessaire
- Backend NestJS horizontalement scalable

---

## 📚 Ressources

- [AWS Lambda Triggers](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools-working-with-aws-lambda-triggers.html)
- [RabbitMQ Documentation](https://www.rabbitmq.com/documentation.html)
- [NestJS Documentation](https://docs.nestjs.com/)
- [AWS SES Documentation](https://docs.aws.amazon.com/ses/)
- [TypeORM Documentation](https://typeorm.io/)

---

**Créé par ClefCloud Team** 🎵  
**Version:** 1.0.0  
**Date:** 2025-10-16
