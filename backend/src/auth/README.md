# 🔐 Module d'authentification ClefCloud

Ce module gère l'authentification complète avec AWS Cognito.

## 📋 Fonctionnalités

### ✅ Gestion du cycle de vie utilisateur

1. **Inscription** (`POST /auth/signup`)
   - Création d'un compte utilisateur dans Cognito
   - Envoi automatique d'un code de confirmation par email
   - Validation des données (email, mot de passe fort)

2. **Confirmation d'inscription** (`POST /auth/confirm-signup`)
   - Vérification du code reçu par email
   - Activation du compte utilisateur
   - Envoi d'un email de bienvenue

3. **Connexion** (`POST /auth/signin`)
   - Authentification avec email et mot de passe
   - Retour de 3 tokens : `accessToken`, `idToken`, `refreshToken`
   - Synchronisation automatique avec la base de données locale

4. **Rafraîchissement de token** (`POST /auth/refresh-token`)
   - Renouvellement de l'access token sans se reconnecter
   - Utilise le refresh token obtenu lors de la connexion
   - Prolonge la session utilisateur

### 🔒 Sécurité du compte

5. **Mot de passe oublié** (`POST /auth/forgot-password`)
   - Demande d'un code de réinitialisation
   - Envoi du code par email

6. **Confirmation du nouveau mot de passe** (`POST /auth/confirm-forgot-password`)
   - Réinitialisation du mot de passe avec le code reçu
   - Validation du nouveau mot de passe

7. **Changement de mot de passe** (`POST /auth/change-password`)
   - Pour les utilisateurs connectés
   - Nécessite l'ancien mot de passe
   - Validation du nouveau mot de passe

8. **Déconnexion** (`POST /auth/signout`)
   - Invalidation de tous les tokens de l'utilisateur
   - Déconnexion globale sur tous les appareils

9. **Suppression de compte** (`DELETE /auth/account`)
   - Suppression du compte Cognito
   - Suppression des données en base de données
   - Action irréversible

### 🔄 Utilitaires

10. **Renvoi du code de confirmation** (`POST /auth/resend-confirmation-code`)
    - Si l'utilisateur n'a pas reçu le code initial
    - Génère et envoie un nouveau code

11. **Profil utilisateur** (`GET /auth/profile` et `GET /auth/me`)
    - Récupération des informations de l'utilisateur connecté
    - Nécessite un token valide

## 🏗️ Architecture

### Services

- **`AuthService`** : Logique métier de l'authentification
- **`CognitoService`** : Communication avec AWS Cognito
- **`MailService`** : Envoi d'emails (bienvenue, notifications)

### Guards

- **`CognitoJwtAuthGuard`** : Protection des routes avec JWT
- Utilise la stratégie `cognito-jwt`
- Vérifie la validité du token auprès de Cognito

### Decorators

- **`@Public()`** : Marque une route comme publique (pas d'authentification requise)
- **`@CurrentUser()`** : Injecte l'utilisateur Cognito dans le contrôleur

### DTOs

- `SignUpDto` : Données d'inscription
- `SignInDto` : Données de connexion
- `ConfirmSignUpDto` : Code de confirmation
- `ForgotPasswordDto` : Demande de réinitialisation
- `ConfirmForgotPasswordDto` : Nouveau mot de passe
- `RefreshTokenDto` : Rafraîchissement de token
- `ChangePasswordDto` : Changement de mot de passe
- `ResendCodeDto` : Renvoi du code

## 🔑 Variables d'environnement requises

```env
# AWS Cognito
AWS_REGION=eu-west-1
COGNITO_USER_POOL_ID=eu-west-1_XXXXXXXXX
COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
COGNITO_CLIENT_SECRET=XXXXXXXXXXXXXXXXXXXXXXXXXX

# AWS Credentials (optionnel si utilisation d'IAM roles)
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

## 📝 Exemples d'utilisation

### Workflow complet

```typescript
// 1. Inscription
POST /auth/signup
{
  "email": "user@example.com",
  "password": "Password123!",
  "name": "John Doe"
}

// 2. Confirmation
POST /auth/confirm-signup
{
  "email": "user@example.com",
  "code": "123456"
}

// 3. Connexion
POST /auth/signin
{
  "email": "user@example.com",
  "password": "Password123!"
}
// → Retourne accessToken, idToken, refreshToken

// 4. Utilisation du token
GET /auth/me
Authorization: Bearer <accessToken>

// 5. Rafraîchissement du token (après expiration)
POST /auth/refresh-token
{
  "refreshToken": "<refreshToken>",
  "email": "user@example.com"
}

// 6. Déconnexion
POST /auth/signout
Authorization: Bearer <accessToken>
```

### Protection d'une route

```typescript
import { UseGuards } from '@nestjs/common';
import { CognitoJwtAuthGuard } from './guards/cognito-jwt-auth.guard';
import { CurrentUser, CognitoUser } from './decorators/current-user.decorator';

@Controller('protected')
@UseGuards(CognitoJwtAuthGuard)
export class ProtectedController {
  @Get('resource')
  async getResource(@CurrentUser() user: CognitoUser) {
    // user contient les informations de l'utilisateur Cognito
    return { message: `Hello ${user.attributes.email}` };
  }
}
```

### Route publique dans un contrôleur protégé

```typescript
import { Public } from './decorators/public.decorator';

@Controller('mixed')
@UseGuards(CognitoJwtAuthGuard)
export class MixedController {
  @Public()
  @Get('public')
  async publicRoute() {
    return { message: 'This is public' };
  }

  @Get('protected')
  async protectedRoute(@CurrentUser() user: CognitoUser) {
    return { message: 'This is protected' };
  }
}
```

## 🧪 Tests

Utilisez le fichier `test-features.http` pour tester toutes les routes d'authentification.

## 🔐 Sécurité

### Bonnes pratiques implémentées

- ✅ Validation stricte des mots de passe (min 8 caractères, majuscule, minuscule, chiffre, caractère spécial)
- ✅ Tokens JWT signés par Cognito
- ✅ Refresh tokens pour prolonger les sessions
- ✅ Déconnexion globale (invalidation de tous les tokens)
- ✅ Secret hash pour sécuriser les appels à Cognito
- ✅ Logs détaillés pour l'audit
- ✅ Gestion des erreurs avec messages appropriés

### Recommandations

- 🔒 Utilisez HTTPS en production
- 🔒 Stockez les tokens de manière sécurisée (httpOnly cookies ou secure storage)
- 🔒 Implémentez un rate limiting pour éviter les attaques par force brute
- 🔒 Activez MFA (Multi-Factor Authentication) dans Cognito pour plus de sécurité
- 🔒 Surveillez les logs pour détecter les activités suspectes

## 📚 Documentation API

La documentation Swagger est disponible à l'adresse :
```
http://localhost:3000/api
```

Toutes les routes d'authentification sont documentées avec :
- Description détaillée
- Paramètres requis
- Exemples de requêtes/réponses
- Codes de statut HTTP

## 🐛 Dépannage

### Erreur "Invalid credentials"
- Vérifiez que l'email et le mot de passe sont corrects
- Assurez-vous que le compte est confirmé

### Erreur "Invalid token"
- Le token a peut-être expiré (durée de vie : 1h)
- Utilisez le refresh token pour obtenir un nouveau token

### Erreur "User not found"
- L'utilisateur n'existe pas dans Cognito
- Vérifiez l'email utilisé

### Erreur "Invalid verification code"
- Le code a expiré (durée de vie : 24h)
- Demandez un nouveau code avec `/auth/resend-confirmation-code`

## 📞 Support

Pour toute question ou problème, consultez :
- La documentation AWS Cognito
- Les logs de l'application
- Le fichier `FEATURES_ADDED.md` pour les exemples
