# Workflow de Test - Authentification Cognito

## Problème résolu

✅ **Erreur corrigée** : "Username cannot be of email format, since user pool is configured for email alias"

**Explication** : Votre User Pool Cognito est configuré avec **email alias**. Cela signifie :
- Le username doit être un UUID (pas un email)
- Cognito permet de se connecter avec l'email directement (alias)
- Pour les opérations admin, on peut utiliser l'email comme identifiant

## Workflow de test complet

### Étape 1 : Inscription

Exécutez la requête **"0. Inscription"** dans `test-features.http` :

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
  "userSub": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "userConfirmed": false
}
```

### Étape 2 : Confirmation (2 options)

#### Option A : Avec le code email (si vous recevez l'email)

```http
POST http://localhost:3000/api/auth/confirm-signup
Content-Type: application/json

{
  "email": "pasyves43@gmail.com",
  "code": "123456"
}
```

#### Option B : Confirmation admin (sans code - DEV ONLY)

Exécutez la requête **"0.2"** dans `test-features.http` :

```http
POST http://localhost:3000/api/auth/admin-confirm-signup
Content-Type: application/json

{
  "email": "pasyves43@gmail.com"
}
```

**Réponse attendue** :
```json
{
  "message": "User confirmed successfully"
}
```

### Étape 3 : Connexion

Exécutez la requête **"1. Connexion"** :

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
    "sub": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "email": "pasyves43@gmail.com",
    "email_verified": true,
    "phone_number": "+237683845543",
    "phone_number_verified": false
  }
}
```

### Étape 4 : Tester une route protégée

Le token est automatiquement extrait dans la variable `@token`. Exécutez la requête **"2. Vérifier le profil"** :

```http
GET http://localhost:3000/api/auth/me
Authorization: Bearer {{token}}
```

**Réponse attendue** :
```json
{
  "sub": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "email": "pasyves43@gmail.com",
  "email_verified": true,
  "username": "pasyves43@gmail.com"
}
```

## Architecture de l'authentification

### Comment fonctionne Email Alias dans Cognito

1. **Inscription** :
   - Username = UUID généré (ex: `a1b2c3d4-...`)
   - Email = `pasyves43@gmail.com` (attribut)
   - Cognito crée automatiquement un alias email → UUID

2. **Connexion** :
   - L'utilisateur peut se connecter avec l'email
   - Cognito résout automatiquement email → UUID
   - Le SECRET_HASH est calculé avec l'email (grâce à l'alias)

3. **Confirmation** :
   - Avec code : utilise l'email (alias)
   - Admin : utilise l'email directement

### Avantages de cette approche

✅ **Flexibilité** : L'utilisateur peut se connecter avec son email
✅ **Sécurité** : Le username interne est un UUID
✅ **Simplicité** : Pas besoin de gérer le mapping manuellement
✅ **Cognito natif** : Utilise les fonctionnalités natives d'AWS

## Commandes de test rapides

### Test complet en une fois

```bash
# 1. Inscription
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"pasyves43@gmail.com","password":"Password123!","phone":"+237683845543"}'

# 2. Confirmation admin
curl -X POST http://localhost:3000/api/auth/admin-confirm-signup \
  -H "Content-Type: application/json" \
  -d '{"email":"pasyves43@gmail.com"}'

# 3. Connexion
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"pasyves43@gmail.com","password":"Password123!"}'
```

## Troubleshooting

### Erreur : "User already exists"

L'utilisateur existe déjà dans Cognito. Options :
1. Utilisez un autre email
2. Supprimez l'utilisateur dans la console AWS Cognito
3. Utilisez la route de connexion directement

### Erreur : "User is not confirmed"

L'utilisateur n'a pas été confirmé. Utilisez :
```http
POST http://localhost:3000/api/auth/admin-confirm-signup
Content-Type: application/json

{
  "email": "pasyves43@gmail.com"
}
```

### Erreur : "Invalid credentials"

Vérifiez :
- Le mot de passe est correct
- L'utilisateur est confirmé
- L'email est correct

### Erreur : "USER_PASSWORD_AUTH flow not enabled"

Allez dans AWS Cognito Console :
1. Sélectionnez votre User Pool
2. Onglet "App integration" → "App clients"
3. Sélectionnez votre app client
4. Sous "Authentication flows", cochez **"ALLOW_USER_PASSWORD_AUTH"**
5. Sauvegardez

## Notes importantes

⚠️ **Numéro de téléphone obligatoire** : Votre User Pool exige un numéro au format international (ex: `+237683845543`)

⚠️ **Admin endpoint** : L'endpoint `admin-confirm-signup` est pour le développement uniquement. Ne l'utilisez jamais en production.

⚠️ **Email verification** : Pour recevoir les emails en développement, vérifiez votre adresse email dans AWS SES (voir `EMAIL_VERIFICATION_GUIDE.md`)

✅ **Prêt pour la production** : Une fois l'email vérifié dans SES ou en sortant du mode sandbox, tout fonctionnera automatiquement.
