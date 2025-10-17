# Guide de Vérification Email - AWS Cognito

## Problème : Je ne reçois pas le code de confirmation par email

### Causes possibles

1. **AWS SES en mode Sandbox** (cause la plus fréquente)
   - Par défaut, AWS SES est en mode sandbox
   - En mode sandbox, vous ne pouvez envoyer d'emails **qu'aux adresses vérifiées**
   - Limite de 200 emails/jour

2. **Email dans les spams**
   - Vérifiez votre dossier spam/courrier indésirable

3. **Configuration Cognito incorrecte**
   - Le User Pool doit être configuré pour envoyer des emails

---

## Solutions

### Solution 1 : Vérifier votre adresse email dans AWS SES (Recommandé pour le développement)

1. Connectez-vous à la console AWS : https://console.aws.amazon.com/ses/
2. Sélectionnez la région de votre User Pool Cognito (ex: `us-east-1`)
3. Dans le menu de gauche, cliquez sur **"Verified identities"**
4. Cliquez sur **"Create identity"**
5. Sélectionnez **"Email address"**
6. Entrez votre adresse email (ex: `pasyves43@gmail.com`)
7. Cliquez sur **"Create identity"**
8. **Vérifiez votre boîte email** - vous recevrez un email de vérification AWS
9. Cliquez sur le lien de vérification dans l'email
10. Une fois vérifié, réessayez l'inscription dans votre application

### Solution 2 : Utiliser l'endpoint admin (DEV ONLY)

J'ai créé un endpoint spécial pour confirmer un utilisateur **sans code** :

```http
POST http://localhost:3000/api/auth/admin-confirm-signup
Content-Type: application/json

{
  "email": "votre-email@example.com"
}
```

**⚠️ Important** : Cette méthode nécessite que vos credentials AWS aient les permissions `cognito-idp:AdminConfirmSignUp`.

Vérifiez que votre fichier `.env` contient :
```
AWS_ACCESS_KEY_ID=votre_access_key
AWS_SECRET_ACCESS_KEY=votre_secret_key
```

### Solution 3 : Sortir du mode Sandbox SES (Production)

Pour la production, vous devez sortir du mode sandbox :

1. Allez dans AWS SES Console
2. Cliquez sur **"Account dashboard"**
3. Sous **"Sending statistics"**, vous verrez "Sandbox"
4. Cliquez sur **"Request production access"**
5. Remplissez le formulaire de demande
6. AWS examinera votre demande (généralement 24-48h)

### Solution 4 : Confirmer manuellement via AWS Console

1. Allez dans AWS Cognito Console
2. Sélectionnez votre User Pool
3. Cliquez sur **"Users"**
4. Trouvez votre utilisateur
5. Cliquez sur l'utilisateur
6. Cliquez sur **"Confirm account"**

---

## Workflow de test recommandé

### Étape 1 : Inscription
```http
POST http://localhost:3000/api/auth/signup
Content-Type: application/json

{
  "email": "pasyves43@gmail.com",
  "password": "Password123!",
  "phone": "+237683845543"
}
```

**Réponse attendue** :
```json
{
  "message": "User created successfully. Please check your email for verification code.",
  "userSub": "d48874b8-1091-700d-55f6-28dc92a575ab",
  "userConfirmed": false
}
```

### Étape 2A : Confirmation avec code (si vous recevez l'email)
```http
POST http://localhost:3000/api/auth/confirm-signup
Content-Type: application/json

{
  "email": "pasyves43@gmail.com",
  "code": "123456"
}
```

### Étape 2B : Confirmation admin (si pas d'email)
```http
POST http://localhost:3000/api/auth/admin-confirm-signup
Content-Type: application/json

{
  "email": "pasyves43@gmail.com"
}
```

### Étape 3 : Connexion
```http
POST http://localhost:3000/api/auth/signin
Content-Type: application/json

{
  "email": "pasyves43@gmail.com",
  "password": "Password123!"
}
```

**Réponse attendue** :
```json
{
  "tokens": {
    "accessToken": "eyJraWQiOiI...",
    "idToken": "eyJraWQiOiI...",
    "refreshToken": "eyJjdHkiOiI..."
  },
  "user": {
    "sub": "d48874b8-1091-700d-55f6-28dc92a575ab",
    "email": "pasyves43@gmail.com",
    "email_verified": true
  }
}
```

---

## Vérification des permissions AWS

Pour utiliser `admin-confirm-signup`, votre utilisateur IAM doit avoir ces permissions :

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cognito-idp:AdminConfirmSignUp",
        "cognito-idp:AdminGetUser"
      ],
      "Resource": "arn:aws:cognito-idp:REGION:ACCOUNT_ID:userpool/USER_POOL_ID"
    }
  ]
}
```

---

## Debugging

### Vérifier les logs du serveur
```bash
# Les logs montreront si l'inscription a réussi
[Nest] 122253  - 15/10/2025 14:25:04     LOG [CognitoService] User signed up: pasyves43@gmail.com
```

### Vérifier l'utilisateur dans Cognito
```bash
aws cognito-idp admin-get-user \
  --user-pool-id YOUR_USER_POOL_ID \
  --username pasyves43@gmail.com
```

### Tester l'envoi d'email SES
Vous pouvez tester si SES fonctionne avec :
```http
GET http://localhost:3000/api/health/test-email
```

---

## Notes importantes

- 📧 **Format du téléphone** : Doit être au format international (ex: `+237683845543`)
- 🔒 **Mot de passe** : Minimum 8 caractères avec majuscules, minuscules et chiffres
- ⚠️ **Admin endpoint** : À utiliser **uniquement en développement**, jamais en production
- 🌍 **Région** : Assurez-vous que SES et Cognito sont dans la même région AWS
