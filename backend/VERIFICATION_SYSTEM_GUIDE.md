# 🔐 Système de Gestion des Codes de Vérification Cognito

## 📋 Vue d'ensemble

Ce système intercepte les codes de vérification AWS Cognito et les gère via une architecture moderne :

```
┌─────────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
│ AWS Cognito │─────▶│  Lambda  │─────▶│ RabbitMQ │─────▶│  NestJS  │
└─────────────┘      └──────────┘      └──────────┘      └──────────┘
                          │                                     │
                          │                                     ▼
                          │                              ┌──────────────┐
                          │                              │  PostgreSQL  │
                          │                              └──────────────┘
                          │                                     │
                          ▼                                     ▼
                    ┌──────────┐                         ┌──────────┐
                    │CloudWatch│                         │ SES/     │
                    │   Logs   │                         │SendGrid  │
                    └──────────┘                         └──────────┘
                                                               │
                                                               ▼
                                                         ┌──────────┐
                                                         │  Email   │
                                                         │  User    │
                                                         └──────────┘
```

---

## 🚀 Installation

### 1. Lambda Function

```bash
cd backend/lambda/cognito-custom-message
npm install
npm run package
```

### 2. Backend NestJS

```bash
cd backend
npm install

# Ajouter les dépendances
npm install amqplib @types/amqplib
npm install @sendgrid/mail  # Optionnel si vous utilisez SendGrid
```

### 3. PostgreSQL - Migration

Créez la table `verification_codes` :

```sql
CREATE TYPE verification_event_type AS ENUM (
  'SIGNUP',
  'FORGOT_PASSWORD',
  'RESEND_CODE',
  'VERIFY_ATTRIBUTE',
  'AUTHENTICATION'
);

CREATE TYPE verification_status AS ENUM (
  'PENDING',
  'SENT',
  'FAILED',
  'EXPIRED',
  'USED'
);

CREATE TABLE verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  user_pool_id VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone_number VARCHAR(50),
  
  verification_code VARCHAR(10) NOT NULL,
  verification_link TEXT,
  
  event_type verification_event_type NOT NULL,
  status verification_status DEFAULT 'PENDING',
  trigger_source VARCHAR(100) NOT NULL,
  lambda_request_id VARCHAR(255),
  user_attributes JSONB,
  
  email_sent_at TIMESTAMP,
  email_provider VARCHAR(50),
  email_message_id VARCHAR(255),
  email_error TEXT,
  
  send_attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMP,
  
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  used_by_ip VARCHAR(50),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX idx_verification_codes_email_status ON verification_codes(email, status);
CREATE INDEX idx_verification_codes_user_id ON verification_codes(user_id);
CREATE INDEX idx_verification_codes_created_at ON verification_codes(created_at);
CREATE INDEX idx_verification_codes_expires_at ON verification_codes(expires_at);

-- Fonction de mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_verification_codes_updated_at
  BEFORE UPDATE ON verification_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 4. RabbitMQ

```bash
# Docker
docker run -d --name rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  -e RABBITMQ_DEFAULT_USER=admin \
  -e RABBITMQ_DEFAULT_PASS=admin123 \
  rabbitmq:3-management

# Ou installation locale
# Ubuntu/Debian
sudo apt-get install rabbitmq-server

# macOS
brew install rabbitmq
```

### 5. Variables d'environnement

Ajoutez dans `.env` :

```env
# RabbitMQ
RABBITMQ_URL=amqp://admin:admin123@localhost:5672

# Email Provider (SES ou SendGrid)
EMAIL_PROVIDER=SES
FROM_EMAIL=noreply@clefcloud.com

# AWS SES (si EMAIL_PROVIDER=SES)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret

# SendGrid (si EMAIL_PROVIDER=SendGrid)
SENDGRID_API_KEY=your_sendgrid_key
```

---

## 📦 Déploiement

### Étape 1 : Déployer la Lambda

```bash
cd backend/lambda/cognito-custom-message

# Créer le rôle IAM
aws iam create-role \
  --role-name CognitoCustomMessageRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "lambda.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

# Attacher les politiques
aws iam attach-role-policy \
  --role-name CognitoCustomMessageRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

aws iam attach-role-policy \
  --role-name CognitoCustomMessageRole \
  --policy-arn arn:aws:iam::aws:policy/CloudWatchLogsFullAccess

# Créer la Lambda
ROLE_ARN=$(aws iam get-role --role-name CognitoCustomMessageRole --query 'Role.Arn' --output text)

aws lambda create-function \
  --function-name CognitoCustomMessage \
  --runtime nodejs18.x \
  --role $ROLE_ARN \
  --handler index.handler \
  --zip-file fileb://function.zip \
  --timeout 30 \
  --memory-size 256 \
  --environment Variables="{RABBITMQ_URL=amqp://your-rabbitmq-url:5672,AWS_REGION=us-east-1}" \
  --region us-east-1
```

### Étape 2 : Connecter Lambda à Cognito

```bash
# Donner les permissions
aws lambda add-permission \
  --function-name CognitoCustomMessage \
  --statement-id CognitoInvoke \
  --action lambda:InvokeFunction \
  --principal cognito-idp.amazonaws.com \
  --source-arn arn:aws:cognito-idp:us-east-1:YOUR_ACCOUNT_ID:userpool/us-east-1_dl0kSgKUl \
  --region us-east-1

# Configurer le trigger dans Cognito
aws cognito-idp update-user-pool \
  --user-pool-id us-east-1_dl0kSgKUl \
  --lambda-config CustomMessage=arn:aws:lambda:us-east-1:YOUR_ACCOUNT_ID:function:CognitoCustomMessage \
  --region us-east-1
```

### Étape 3 : Démarrer le backend

```bash
cd backend
npm run start:dev
```

---

## 🧪 Test

### Test de la Lambda localement

```bash
cd backend/lambda/cognito-custom-message
node test-local.js
```

### Test du flux complet

1. **Inscription** : Créez un compte sur `/signup`
2. **Vérifiez RabbitMQ** : http://localhost:15672 (admin/admin123)
3. **Vérifiez PostgreSQL** :
   ```sql
   SELECT * FROM verification_codes ORDER BY created_at DESC LIMIT 10;
   ```
4. **Vérifiez CloudWatch** : AWS Console → CloudWatch → Logs
5. **Vérifiez l'email** : Boîte de réception

---

## 📊 API Endpoints

### GET /api/verification
Liste tous les codes de vérification

**Query params:**
- `limit` (number): Nombre de résultats
- `offset` (number): Pagination
- `status` (enum): PENDING, SENT, FAILED, EXPIRED, USED
- `eventType` (enum): SIGNUP, FORGOT_PASSWORD, etc.
- `email` (string): Filtrer par email

### GET /api/verification/stats
Statistiques globales

### GET /api/verification/email/:email
Codes pour un email spécifique

### GET /api/verification/:id
Détails d'un code

### POST /api/verification/:id/mark-used
Marquer un code comme utilisé

### POST /api/verification/:id/retry
Réessayer l'envoi d'un email échoué

### POST /api/verification/cleanup
Nettoyer les codes expirés

---

## 🎨 Interface React Admin (À venir)

L'interface React permettra de :
- ✅ Visualiser tous les codes en temps réel
- ✅ Filtrer par statut, type, email
- ✅ Voir les statistiques
- ✅ Réessayer les envois échoués
- ✅ Rechercher un code spécifique
- ✅ Voir les logs CloudWatch

---

## 🔧 Maintenance

### Nettoyage automatique des codes expirés

Ajoutez un cron job :

```typescript
// backend/src/verification/verification.cron.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { VerificationService } from './verification.service';

@Injectable()
export class VerificationCron {
  private readonly logger = new Logger(VerificationCron.name);

  constructor(private readonly verificationService: VerificationService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpired() {
    this.logger.log('🧹 Nettoyage des codes expirés...');
    const count = await this.verificationService.cleanupExpired();
    this.logger.log(`✅ ${count} codes nettoyés`);
  }
}
```

### Monitoring CloudWatch

Les logs sont automatiquement envoyés à :
- `/aws/lambda/cognito-verification-codes/{eventType}-{date}`
- `/aws/lambda/cognito-verification-codes/errors-{date}`

---

## 🎯 Avantages de cette architecture

✅ **Asynchrone** : RabbitMQ gère la file d'attente
✅ **Résilient** : Retry automatique en cas d'échec
✅ **Traçable** : PostgreSQL + CloudWatch
✅ **Scalable** : Lambda + RabbitMQ
✅ **Flexible** : SES ou SendGrid
✅ **Audit** : Tous les codes sont enregistrés
✅ **Admin UI** : Interface React pour la gestion

---

## 📝 Notes importantes

⚠️ **Sécurité** :
- Les codes sont stockés en clair dans PostgreSQL (pour debug)
- En production, considérez le chiffrement
- Limitez l'accès à l'API admin

⚠️ **Performance** :
- RabbitMQ peut gérer des milliers de messages/seconde
- PostgreSQL indexé pour les requêtes rapides
- Lambda scale automatiquement

⚠️ **Coûts** :
- Lambda : ~$0.20 par million de requêtes
- RabbitMQ : Gratuit (auto-hébergé) ou CloudAMQP
- SES : $0.10 par 1000 emails
- SendGrid : Plan gratuit (100 emails/jour)

---

## 🆘 Troubleshooting

### La Lambda ne reçoit pas les événements
- Vérifiez les permissions IAM
- Vérifiez le trigger Cognito
- Consultez CloudWatch Logs

### RabbitMQ ne reçoit pas les messages
- Vérifiez la connexion réseau
- Vérifiez les credentials
- Consultez les logs Lambda

### Les emails ne sont pas envoyés
- Vérifiez SES sandbox mode
- Vérifiez les credentials AWS
- Consultez les logs NestJS

---

## 📚 Ressources

- [AWS Lambda Triggers](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools-working-with-aws-lambda-triggers.html)
- [RabbitMQ Tutorials](https://www.rabbitmq.com/getstarted.html)
- [NestJS Documentation](https://docs.nestjs.com/)
- [AWS SES Documentation](https://docs.aws.amazon.com/ses/)

---

**Créé par ClefCloud Team** 🎵
