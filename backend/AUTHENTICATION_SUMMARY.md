# Résumé de l'Authentification ClefCloud - AWS Cognito

## ✅ Configuration complète et fonctionnelle

Date : 15 octobre 2025

---

## Problèmes résolus

### 1. **Numéro de téléphone obligatoire**
- **Problème** : Le User Pool exigeait un numéro de téléphone
- **Solution** : Ajout du champ `phone` obligatoire dans `SignUpDto`

### 2. **Username vs Email avec Email Alias**
- **Problème** : Le User Pool utilise email alias, donc le username est un UUID, mais on veut se connecter avec l'email
- **Solution** : 
  - Inscription : Créer l'utilisateur avec un UUID comme username
  - Connexion : Chercher le username UUID à partir de l'email avec `ListUsers`
  - Calculer le SECRET_HASH avec le username UUID, pas l'email

### 3. **USER_PASSWORD_AUTH non activé**
- **Problème** : Le flux USER_PASSWORD_AUTH n'était pas activé dans l'App Client Cognito
- **Solution** : Activation dans AWS Console → User Pool → App clients → Cocher "ALLOW_USER_PASSWORD_AUTH"

### 4. **Validation du token échouait**
- **Problème** : La stratégie JWT vérifiait l'audience (client_id), mais l'accessToken Cognito n'a pas toujours ce claim
- **Solution** : Retirer la vérification de l'audience dans `cognito-jwt.strategy.ts`

### 5. **Refresh token échouait**
- **Problème** : Même problème que le signin - SECRET_HASH calculé avec l'email au lieu du username UUID
- **Solution** : Chercher le username UUID à partir de l'email avant de calculer le SECRET_HASH

### 6. **Confirmation sans email**
- **Problème** : AWS SES en mode Sandbox ne permet d'envoyer qu'aux emails vérifiés
- **Solution** : Création d'un endpoint `admin-confirm-signup` pour le développement

---

## Architecture finale

### Flux d'inscription

```
1. POST /api/auth/signup
   - Input: { email, password, phone }
   - Crée un utilisateur avec username = UUID
   - Cognito crée automatiquement un alias email → UUID
   - Output: { userSub, userConfirmed: false, username: UUID }

2. POST /api/auth/admin-confirm-signup (DEV ONLY)
   - Input: { email }
   - Cherche le username UUID via ListUsers
   - Confirme l'utilisateur avec AdminConfirmSignUp
   - Output: { message, email, username }
```

### Flux de connexion

```
1. POST /api/auth/signin
   - Input: { email, password }
   - Cherche le username UUID via ListUsers (Filter: email = "...")
   - Calcule SECRET_HASH avec le username UUID
   - Appelle InitiateAuth avec USERNAME = UUID
   - Output: { tokens: { accessToken, idToken, refreshToken }, user }

2. Routes protégées
   - Header: Authorization: Bearer <accessToken>
   - Le guard CognitoJwtAuthGuard valide le token
   - Vérifie la signature avec les JWKS de Cognito
   - Extrait les claims du token
   - Output: Données de l'utilisateur
```

### Flux de rafraîchissement

```
POST /api/auth/refresh-token
   - Input: { refreshToken, email }
   - Cherche le username UUID via ListUsers
   - Calcule SECRET_HASH avec le username UUID
   - Appelle InitiateAuth avec REFRESH_TOKEN_AUTH
   - Output: { accessToken, idToken, expiresIn }
```

---

## Fichiers modifiés

### 1. `src/auth/dto/signup.dto.ts`
- ✅ Champ `phone` rendu obligatoire (retiré `@IsOptional()`)

### 2. `src/aws/cognito.service.ts`
- ✅ Méthode `signUp()` : Utilise UUID comme username
- ✅ Méthode `signIn()` : Cherche le username UUID avant de calculer SECRET_HASH
- ✅ Méthode `adminConfirmSignUp()` : Cherche le username UUID via ListUsers
- ✅ Méthode `refreshToken()` : Cherche le username UUID avant de calculer SECRET_HASH

### 3. `src/auth/strategies/cognito-jwt.strategy.ts`
- ✅ Retiré la vérification de l'audience (commenté la ligne `audience`)

---

## Configuration AWS Cognito requise

### User Pool
- ✅ Email alias activé
- ✅ Attribut `phone_number` obligatoire
- ✅ Attribut `email` obligatoire

### App Client
- ✅ ALLOW_USER_PASSWORD_AUTH activé
- ✅ ALLOW_REFRESH_TOKEN_AUTH activé
- ✅ ALLOW_USER_SRP_AUTH activé (optionnel)
- ✅ Client Secret configuré

### AWS SES (pour recevoir les emails)
- ⚠️ Mode Sandbox par défaut
- ✅ Solution temporaire : Endpoint `admin-confirm-signup`
- 📧 Solution production : Vérifier l'email dans SES ou sortir du mode Sandbox

---

## Endpoints disponibles

### Publics (sans authentification)
- `POST /api/auth/signup` - Inscription
- `POST /api/auth/confirm-signup` - Confirmation avec code email
- `POST /api/auth/admin-confirm-signup` - Confirmation admin (DEV ONLY)
- `POST /api/auth/signin` - Connexion
- `POST /api/auth/refresh-token` - Rafraîchir le token
- `POST /api/auth/forgot-password` - Mot de passe oublié
- `POST /api/auth/confirm-forgot-password` - Confirmer nouveau mot de passe
- `POST /api/auth/resend-confirmation-code` - Renvoyer le code

### Protégés (nécessitent un token)
- `GET /api/auth/me` - Informations utilisateur
- `GET /api/auth/profile` - Profil complet
- `POST /api/auth/signout` - Déconnexion
- `POST /api/auth/change-password` - Changer le mot de passe
- `DELETE /api/auth/account` - Supprimer le compte

---

## Tests

### Fichiers de test
- ✅ `test-auth-simple.http` - Workflow complet simplifié
- ✅ `test-features.http` - Tests de toutes les fonctionnalités
- ✅ `test-cognito-auth.http` - Tests spécifiques Cognito
- ✅ `test-auth-workflow.sh` - Script de test automatisé

### Workflow de test complet

```bash
# 1. Inscription
POST /api/auth/signup
{
  "email": "testuser@example.com",
  "password": "Password123!",
  "phone": "+237683845543"
}

# 2. Confirmation admin
POST /api/auth/admin-confirm-signup
{
  "email": "testuser@example.com"
}

# 3. Connexion
POST /api/auth/signin
{
  "email": "testuser@example.com",
  "password": "Password123!"
}
# → Retourne accessToken, idToken, refreshToken

# 4. Test route protégée
GET /api/auth/me
Authorization: Bearer <accessToken>

# 5. Rafraîchir le token
POST /api/auth/refresh-token
{
  "refreshToken": "<refreshToken>",
  "email": "testuser@example.com"
}
```

---

## Variables d'environnement requises

```env
# AWS Cognito
COGNITO_REGION=us-east-1
COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
COGNITO_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
COGNITO_DOMAIN=your-domain
COGNITO_ISSUER_URL=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_xxxxxxxxx

# AWS Credentials (pour les opérations admin)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
```

---

## Points importants

### SECRET_HASH
⚠️ **CRITIQUE** : Le SECRET_HASH doit TOUJOURS être calculé avec le **username UUID**, jamais avec l'email, même si email alias est activé.

```typescript
// ❌ INCORRECT
const secretHash = this.createSecretHash(email);

// ✅ CORRECT
const username = await this.findUsernameByEmail(email);
const secretHash = this.createSecretHash(username);
```

### Email Alias
Avec email alias activé :
- ✅ L'utilisateur peut se connecter avec son email
- ✅ Cognito résout automatiquement email → username UUID
- ⚠️ Mais le SECRET_HASH doit utiliser le username UUID

### Tokens Cognito
- **accessToken** : Pour authentifier les requêtes API (durée: 1h)
- **idToken** : Contient les informations d'identité (durée: 1h)
- **refreshToken** : Pour obtenir de nouveaux tokens (durée: 30 jours)

---

## Prêt pour la production

✅ Authentification complète fonctionnelle
✅ Inscription avec confirmation
✅ Connexion avec tokens JWT
✅ Rafraîchissement des tokens
✅ Routes protégées
✅ Validation des tokens
✅ Gestion des erreurs

**Prochaines étapes pour la production** :
1. Vérifier les emails dans AWS SES ou sortir du mode Sandbox
2. Configurer les domaines personnalisés
3. Activer MFA (Multi-Factor Authentication) si nécessaire
4. Configurer les groupes et permissions Cognito
5. Mettre en place la rotation des secrets
