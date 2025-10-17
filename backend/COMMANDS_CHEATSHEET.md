# 🚀 Cheatsheet - Commandes Système de Vérification

## ⚡ Installation rapide

```bash
# Installation automatique
./install-verification-system.sh
```

---

## 🐰 RabbitMQ

### Démarrage

```bash
# Docker
docker-compose -f docker-compose.rabbitmq.yml up -d

# Vérifier le statut
docker ps | grep rabbitmq

# Logs
docker logs -f clefcloud-rabbitmq
```

### Arrêt

```bash
docker-compose -f docker-compose.rabbitmq.yml down

# Avec suppression des volumes
docker-compose -f docker-compose.rabbitmq.yml down -v
```

### Management

```bash
# Accès UI
open http://localhost:15672
# Login: admin / admin123

# Lister les queues
docker exec clefcloud-rabbitmq rabbitmqctl list_queues

# Purger une queue
docker exec clefcloud-rabbitmq rabbitmqctl purge_queue cognito-verification-codes

# Statistiques
docker exec clefcloud-rabbitmq rabbitmqctl status
```

---

## 🗄️ PostgreSQL

### Migration

```bash
cd migrations
./apply-migration.sh
```

### Connexion

```bash
# Via psql
psql -h $DB_HOST -U $DB_USER -d $DB_NAME

# Via Docker (si PostgreSQL en Docker)
docker exec -it postgres-container psql -U clefcloud_admin -d clefcloud
```

### Requêtes utiles

```sql
-- Tous les codes
SELECT * FROM verification_codes ORDER BY created_at DESC LIMIT 10;

-- Statistiques
SELECT event_type, status, COUNT(*) 
FROM verification_codes 
GROUP BY event_type, status;

-- Codes d'un email
SELECT * FROM verification_codes 
WHERE email = 'test@example.com' 
ORDER BY created_at DESC;

-- Codes des dernières 24h
SELECT COUNT(*) FROM verification_codes 
WHERE created_at > NOW() - INTERVAL '24 hours';

-- Nettoyer les codes expirés
SELECT cleanup_expired_verification_codes();

-- Vue des statistiques
SELECT * FROM verification_stats;

-- Taux de succès
SELECT 
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'SENT') / COUNT(*), 2) as success_rate
FROM verification_codes
WHERE created_at > NOW() - INTERVAL '24 hours';
```

---

## 🎯 Backend NestJS

### Démarrage

```bash
# Développement
npm run start:dev

# Production
npm run build
npm run start:prod

# Debug
npm run start:debug
```

### Logs

```bash
# Filtrer les logs RabbitMQ
npm run start:dev | grep RabbitMQ

# Filtrer les logs Email
npm run start:dev | grep Email

# Filtrer les logs Verification
npm run start:dev | grep Verification
```

### Tests

```bash
# Tests unitaires
npm run test

# Tests e2e
npm run test:e2e

# Coverage
npm run test:cov
```

---

## ⚡ Lambda

### Déploiement

```bash
cd lambda/cognito-custom-message

# Première fois
./deploy.sh create

# Mise à jour
./deploy.sh update
```

### Test local

```bash
cd lambda/cognito-custom-message
node test-local.js
```

### AWS CLI

```bash
# Invoquer manuellement
aws lambda invoke \
  --function-name CognitoCustomMessage \
  --payload file://test-event.json \
  output.json

# Voir les logs
aws logs tail /aws/lambda/CognitoCustomMessage --follow

# Voir la configuration
aws lambda get-function --function-name CognitoCustomMessage

# Mettre à jour les variables d'environnement
aws lambda update-function-configuration \
  --function-name CognitoCustomMessage \
  --environment Variables="{RABBITMQ_URL=amqp://new-url:5672}"

# Supprimer la fonction
aws lambda delete-function --function-name CognitoCustomMessage
```

---

## 🔐 Cognito

### Vérifier la configuration

```bash
# Voir le User Pool
aws cognito-idp describe-user-pool \
  --user-pool-id us-east-1_dl0kSgKUl

# Voir les triggers Lambda
aws cognito-idp describe-user-pool \
  --user-pool-id us-east-1_dl0kSgKUl \
  --query 'UserPool.LambdaConfig'

# Lister les utilisateurs
aws cognito-idp list-users \
  --user-pool-id us-east-1_dl0kSgKUl

# Supprimer un utilisateur
aws cognito-idp admin-delete-user \
  --user-pool-id us-east-1_dl0kSgKUl \
  --username user@example.com
```

---

## 📧 API REST

### Endpoints

```bash
# Liste des codes
curl http://localhost:3000/api/verification

# Avec filtres
curl "http://localhost:3000/api/verification?limit=10&status=SENT&email=test@example.com"

# Statistiques
curl http://localhost:3000/api/verification/stats

# Codes pour un email
curl http://localhost:3000/api/verification/email/test@example.com

# Détails d'un code
curl http://localhost:3000/api/verification/{id}

# Marquer comme utilisé
curl -X POST http://localhost:3000/api/verification/{id}/mark-used \
  -H "Content-Type: application/json" \
  -d '{"ipAddress":"192.168.1.1"}'

# Réessayer l'envoi
curl -X POST http://localhost:3000/api/verification/{id}/retry

# Nettoyer les codes expirés
curl -X POST http://localhost:3000/api/verification/cleanup
```

### Avec authentification

```bash
# Obtenir un token
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}' \
  | jq -r '.accessToken')

# Utiliser le token
curl http://localhost:3000/api/verification \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🧪 Tests

### Test complet du flux

```bash
# 1. Créer un compte
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!",
    "firstName": "Test",
    "lastName": "User"
  }'

# 2. Vérifier RabbitMQ
open http://localhost:15672

# 3. Vérifier PostgreSQL
psql -h $DB_HOST -U $DB_USER -d $DB_NAME \
  -c "SELECT email, verification_code, status FROM verification_codes ORDER BY created_at DESC LIMIT 1;"

# 4. Vérifier les logs Lambda
aws logs tail /aws/lambda/cognito-verification-codes --follow

# 5. Tester le mot de passe oublié
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

---

## 📊 Monitoring

### CloudWatch

```bash
# Suivre les logs Lambda
aws logs tail /aws/lambda/cognito-verification-codes --follow

# Logs d'un type spécifique
aws logs tail /aws/lambda/cognito-verification-codes/SIGNUP-$(date +%Y-%m-%d) --follow

# Rechercher dans les logs
aws logs filter-pattern /aws/lambda/cognito-verification-codes \
  --filter-pattern "ERROR" \
  --start-time $(date -u -d '1 hour ago' +%s)000

# Créer une alarme
aws cloudwatch put-metric-alarm \
  --alarm-name lambda-errors \
  --alarm-description "Alert on Lambda errors" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold
```

### Métriques PostgreSQL

```sql
-- Statistiques de la table
SELECT 
  schemaname,
  tablename,
  n_live_tup as live_rows,
  n_dead_tup as dead_rows,
  last_vacuum,
  last_autovacuum
FROM pg_stat_user_tables
WHERE tablename = 'verification_codes';

-- Taille de la table
SELECT 
  pg_size_pretty(pg_total_relation_size('verification_codes')) as total_size,
  pg_size_pretty(pg_relation_size('verification_codes')) as table_size,
  pg_size_pretty(pg_indexes_size('verification_codes')) as indexes_size;

-- Performance des index
SELECT 
  indexrelname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public' AND tablename = 'verification_codes';
```

---

## 🔧 Maintenance

### Nettoyage

```bash
# Nettoyer les codes expirés (API)
curl -X POST http://localhost:3000/api/verification/cleanup

# Nettoyer les codes expirés (SQL)
psql -h $DB_HOST -U $DB_USER -d $DB_NAME \
  -c "SELECT cleanup_expired_verification_codes();"

# Vacuum PostgreSQL
psql -h $DB_HOST -U $DB_USER -d $DB_NAME \
  -c "VACUUM ANALYZE verification_codes;"
```

### Backup

```bash
# Backup PostgreSQL
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME \
  -t verification_codes > backup_$(date +%Y%m%d).sql

# Restore
psql -h $DB_HOST -U $DB_USER -d $DB_NAME < backup_20251016.sql

# Backup RabbitMQ definitions
docker exec clefcloud-rabbitmq rabbitmqctl export_definitions /tmp/definitions.json
docker cp clefcloud-rabbitmq:/tmp/definitions.json ./rabbitmq_backup.json
```

---

## 🐛 Debug

### Vérifier la connectivité

```bash
# RabbitMQ
telnet localhost 5672

# PostgreSQL
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT 1;"

# Lambda
aws lambda get-function --function-name CognitoCustomMessage

# Backend
curl http://localhost:3000/health
```

### Logs détaillés

```bash
# Backend avec logs détaillés
LOG_LEVEL=debug npm run start:dev

# Lambda logs en temps réel
aws logs tail /aws/lambda/CognitoCustomMessage --follow --format short

# RabbitMQ logs
docker logs -f clefcloud-rabbitmq --tail 100
```

### Réinitialisation complète

```bash
# Arrêter tout
docker-compose -f docker-compose.rabbitmq.yml down -v
pkill -f "nest start"

# Nettoyer la base
psql -h $DB_HOST -U $DB_USER -d $DB_NAME \
  -c "TRUNCATE TABLE verification_codes RESTART IDENTITY CASCADE;"

# Redémarrer
docker-compose -f docker-compose.rabbitmq.yml up -d
npm run start:dev
```

---

## 📦 Variables d'environnement

### Afficher les variables

```bash
# Toutes les variables
cat .env

# Variable spécifique
grep RABBITMQ_URL .env

# Exporter pour utilisation
export $(cat .env | grep -v '^#' | xargs)
```

### Valider la configuration

```bash
# Vérifier que toutes les variables sont définies
required_vars=("RABBITMQ_URL" "EMAIL_PROVIDER" "AWS_REGION" "DB_USERNAME")
for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ $var n'est pas défini"
  else
    echo "✅ $var est défini"
  fi
done
```

---

## 🎯 Raccourcis utiles

```bash
# Alias à ajouter dans ~/.bashrc ou ~/.zshrc

# Backend
alias clef-start="cd /home/christian/Bureau/CHRISTIAN/ClefCloud/backend && npm run start:dev"
alias clef-logs="cd /home/christian/Bureau/CHRISTIAN/ClefCloud/backend && npm run start:dev | grep -E 'RabbitMQ|Email|Verification'"

# RabbitMQ
alias rabbit-start="docker-compose -f docker-compose.rabbitmq.yml up -d"
alias rabbit-stop="docker-compose -f docker-compose.rabbitmq.yml down"
alias rabbit-ui="open http://localhost:15672"
alias rabbit-logs="docker logs -f clefcloud-rabbitmq"

# PostgreSQL
alias pg-connect="psql -h \$DB_HOST -U \$DB_USER -d \$DB_NAME"
alias pg-codes="psql -h \$DB_HOST -U \$DB_USER -d \$DB_NAME -c 'SELECT * FROM verification_codes ORDER BY created_at DESC LIMIT 10;'"
alias pg-stats="psql -h \$DB_HOST -U \$DB_USER -d \$DB_NAME -c 'SELECT * FROM verification_stats;'"

# Lambda
alias lambda-logs="aws logs tail /aws/lambda/cognito-verification-codes --follow"
alias lambda-deploy="cd lambda/cognito-custom-message && ./deploy.sh update && cd ../.."

# API
alias api-stats="curl http://localhost:3000/api/verification/stats | jq"
alias api-codes="curl http://localhost:3000/api/verification | jq"
```

---

## 📚 Documentation rapide

```bash
# Voir le guide complet
cat COGNITO_VERIFICATION_COMPLETE_GUIDE.md | less

# Quick start
cat VERIFICATION_QUICK_START.md

# Résumé
cat VERIFICATION_SYSTEM_SUMMARY.md

# Rechercher dans la doc
grep -r "RabbitMQ" *.md
```

---

**Sauvegardez ce fichier pour référence rapide !** 📌
