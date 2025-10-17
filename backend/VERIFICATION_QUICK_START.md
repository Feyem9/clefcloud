# ⚡ Quick Start - Système de Vérification Cognito

## 🚀 Démarrage en 5 minutes

### 1️⃣ Démarrer RabbitMQ

```bash
cd /home/christian/Bureau/CHRISTIAN/ClefCloud/backend
docker-compose -f docker-compose.rabbitmq.yml up -d
```

✅ Vérifiez : http://localhost:15672 (admin/admin123)

---

### 2️⃣ Créer la base de données

```bash
cd migrations
./apply-migration.sh
```

✅ Vérifiez :
```sql
SELECT COUNT(*) FROM verification_codes;
```

---

### 3️⃣ Configurer les variables d'environnement

Ajoutez dans `.env` :

```env
# RabbitMQ
RABBITMQ_URL=amqp://admin:admin123@localhost:5672

# Email Provider
EMAIL_PROVIDER=SES
FROM_EMAIL=noreply@clefcloud.com
```

---

### 4️⃣ Démarrer le backend

```bash
npm run start:dev
```

✅ Vérifiez les logs :
```
🐰 Connexion à RabbitMQ: amqp://localhost:5672
✅ Connecté à RabbitMQ - Queue: cognito-verification-codes
👂 Écoute de la queue: cognito-verification-codes
📧 Email provider: AWS SES
```

---

### 5️⃣ Déployer la Lambda

```bash
cd lambda/cognito-custom-message
./deploy.sh create
```

✅ Vérifiez :
```bash
aws lambda get-function --function-name CognitoCustomMessage
```

---

## 🧪 Test

### Test complet du flux

1. **Créer un compte** :
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

2. **Vérifier RabbitMQ** : http://localhost:15672
   - Queue : `cognito-verification-codes`
   - Messages : 1

3. **Vérifier PostgreSQL** :
```sql
SELECT email, verification_code, status 
FROM verification_codes 
ORDER BY created_at DESC 
LIMIT 1;
```

4. **Vérifier l'email** : Boîte de réception

5. **Vérifier CloudWatch** :
```bash
aws logs tail /aws/lambda/cognito-verification-codes --follow
```

---

## 📊 Dashboard

### RabbitMQ Management
- **URL** : http://localhost:15672
- **Login** : admin / admin123
- **Queue** : cognito-verification-codes

### API Endpoints

```bash
# Liste des codes
curl http://localhost:3000/api/verification

# Statistiques
curl http://localhost:3000/api/verification/stats

# Codes pour un email
curl http://localhost:3000/api/verification/email/test@example.com
```

---

## 🔧 Commandes utiles

### Backend

```bash
# Démarrer
npm run start:dev

# Logs
npm run start:dev | grep -E "RabbitMQ|Email|Verification"

# Build
npm run build
```

### Lambda

```bash
# Tester localement
cd lambda/cognito-custom-message
node test-local.js

# Déployer
./deploy.sh update

# Logs
aws logs tail /aws/lambda/CognitoCustomMessage --follow
```

### RabbitMQ

```bash
# Démarrer
docker-compose -f docker-compose.rabbitmq.yml up -d

# Arrêter
docker-compose -f docker-compose.rabbitmq.yml down

# Logs
docker logs -f clefcloud-rabbitmq

# Purger la queue
docker exec clefcloud-rabbitmq rabbitmqctl purge_queue cognito-verification-codes
```

### PostgreSQL

```bash
# Connexion
psql -h $DB_HOST -U $DB_USER -d $DB_NAME

# Statistiques
SELECT event_type, status, COUNT(*) 
FROM verification_codes 
GROUP BY event_type, status;

# Derniers codes
SELECT email, verification_code, status, created_at 
FROM verification_codes 
ORDER BY created_at DESC 
LIMIT 10;

# Nettoyer les codes expirés
SELECT cleanup_expired_verification_codes();
```

---

## 🐛 Troubleshooting rapide

### ❌ RabbitMQ ne démarre pas

```bash
docker-compose -f docker-compose.rabbitmq.yml down -v
docker-compose -f docker-compose.rabbitmq.yml up -d
```

### ❌ Backend ne se connecte pas à RabbitMQ

Vérifiez `.env` :
```env
RABBITMQ_URL=amqp://admin:admin123@localhost:5672
```

### ❌ Lambda ne reçoit pas les événements

```bash
# Vérifier le trigger
aws cognito-idp describe-user-pool \
  --user-pool-id us-east-1_dl0kSgKUl \
  --query 'UserPool.LambdaConfig'

# Reconfigurer
./deploy.sh create
```

### ❌ Emails non envoyés

1. Vérifiez SES sandbox mode
2. Vérifiez que l'email est vérifié dans SES
3. Consultez les logs : `status = 'FAILED'`
4. Réessayez : `POST /api/verification/:id/retry`

---

## 📚 Documentation complète

Pour plus de détails, consultez :
- [COGNITO_VERIFICATION_COMPLETE_GUIDE.md](./COGNITO_VERIFICATION_COMPLETE_GUIDE.md)
- [VERIFICATION_SYSTEM_GUIDE.md](./VERIFICATION_SYSTEM_GUIDE.md)

---

## ✅ Checklist de déploiement

- [ ] RabbitMQ démarré
- [ ] Base de données créée
- [ ] Variables d'environnement configurées
- [ ] Backend démarré
- [ ] Lambda déployée
- [ ] Trigger Cognito configuré
- [ ] Email vérifié dans SES
- [ ] Test de bout en bout réussi

---

**Prêt à démarrer !** 🎉

Si vous rencontrez des problèmes, consultez la section [Troubleshooting](./COGNITO_VERIFICATION_COMPLETE_GUIDE.md#troubleshooting) du guide complet.
