# Intégration Cognito JWT dans NestJS

Ce guide explique comment utiliser l'authentification Amazon Cognito JWT dans votre application NestJS.

## 🎯 Architecture

L'intégration utilise :
- **Passport.js** : Framework d'authentification
- **passport-jwt** : Stratégie JWT pour Passport
- **jwks-rsa** : Validation des tokens JWT avec les clés publiques Cognito

## 📁 Structure des fichiers

```
src/auth/
├── strategies/
│   └── cognito-jwt.strategy.ts    # Stratégie Passport pour valider les JWT Cognito
├── guards/
│   └── cognito-jwt-auth.guard.ts  # Guard pour protéger les routes
├── decorators/
│   ├── public.decorator.ts        # Decorator pour marquer les routes publiques
│   ├── current-user.decorator.ts  # Decorator pour récupérer l'utilisateur
│   └── index.ts
├── auth.controller.ts             # Contrôleur avec exemples de routes protégées
├── auth.service.ts
└── auth.module.ts                 # Module configuré avec Passport
```

## 🔐 Comment ça fonctionne ?

### 1. Validation du JWT

Quand un utilisateur envoie une requête avec un token JWT :

```
Authorization: Bearer eyJraWQiOiJ...
```

La stratégie `CognitoJwtStrategy` :
1. Extrait le token du header `Authorization`
2. Télécharge les clés publiques depuis Cognito (JWKS)
3. Vérifie la signature du token
4. Valide l'issuer et l'audience
5. Retourne les informations utilisateur

### 2. Protection des routes

Par défaut, toutes les routes du contrôleur sont protégées grâce à :

```typescript
@UseGuards(CognitoJwtAuthGuard)
export class AuthController {
  // ...
}
```

### 3. Routes publiques

Pour rendre une route accessible sans authentification :

```typescript
@Public()
@Post('signin')
async signIn(@Body() signInDto: SignInDto) {
  return this.authService.signIn(signInDto);
}
```

### 4. Récupérer l'utilisateur connecté

Utilisez le decorator `@CurrentUser()` :

```typescript
@Get('profile')
async getProfile(@CurrentUser() user: CognitoUser) {
  return user;
}
```

## 🚀 Utilisation

### Routes publiques (pas d'authentification requise)

#### 1. Inscription
```bash
POST /auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123!",
  "username": "john_doe"
}
```

#### 2. Connexion
```bash
POST /auth/signin
Content-Type: application/json

{
  "username": "john_doe",
  "password": "Password123!"
}
```

**Réponse :**
```json
{
  "accessToken": "eyJraWQiOiJ...",
  "idToken": "eyJraWQiOiJ...",
  "refreshToken": "eyJjdHkiOiJ...",
  "expiresIn": 3600
}
```

### Routes protégées (authentification requise)

#### 3. Récupérer le profil
```bash
GET /auth/profile
Authorization: Bearer eyJraWQiOiJ...
```

**Réponse :**
```json
{
  "message": "Profil utilisateur récupéré avec succès",
  "user": {
    "userId": "12345678-1234-1234-1234-123456789abc",
    "username": "john_doe",
    "email": "user@example.com",
    "emailVerified": true,
    "groups": [],
    "tokenUse": "access"
  }
}
```

#### 4. Récupérer les informations utilisateur
```bash
GET /auth/me
Authorization: Bearer eyJraWQiOiJ...
```

## 🛡️ Protéger vos propres routes

### Dans un contrôleur

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { CognitoJwtAuthGuard } from '../auth/guards/cognito-jwt-auth.guard';
import { CurrentUser, CognitoUser } from '../auth/decorators';

@Controller('partitions')
@UseGuards(CognitoJwtAuthGuard)  // Protège toutes les routes
export class PartitionsController {
  
  @Get()
  async findAll(@CurrentUser() user: CognitoUser) {
    // L'utilisateur est automatiquement authentifié
    console.log('User ID:', user.userId);
    return this.partitionsService.findAllForUser(user.userId);
  }

  @Get('public')
  @Public()  // Cette route est accessible sans authentification
  async findPublic() {
    return this.partitionsService.findPublic();
  }
}
```

### Globalement (toute l'application)

Pour protéger toutes les routes par défaut, ajoutez dans `main.ts` :

```typescript
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { CognitoJwtAuthGuard } from './auth/guards/cognito-jwt-auth.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Applique le guard globalement
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new CognitoJwtAuthGuard(reflector));
  
  await app.listen(3000);
}
bootstrap();
```

## 🧪 Tester avec Postman ou cURL

### 1. Obtenir un token

```bash
curl -X POST http://localhost:3000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "password": "Password123!"
  }'
```

### 2. Utiliser le token

```bash
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

## 📊 Interface CognitoUser

Les informations disponibles dans `@CurrentUser()` :

```typescript
interface CognitoUser {
  userId: string;           // Sub (Subject) - ID unique de l'utilisateur
  username: string;         // Nom d'utilisateur Cognito
  email: string;           // Email de l'utilisateur
  emailVerified: boolean;  // Email vérifié ou non
  groups: string[];        // Groupes Cognito auxquels l'utilisateur appartient
  tokenUse: string;        // 'access' ou 'id'
}
```

## ⚙️ Configuration

Les variables d'environnement nécessaires (déjà dans votre `.env`) :

```env
COGNITO_REGION=us-east-1
COGNITO_USER_POOL_ID=us-east-1_dl0kSgKUl
COGNITO_CLIENT_ID=2pu1v5mpa5eht36m8im2ns40sf
COGNITO_ISSUER_URL=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_dl0kSgKUl
```

## 🔍 Debugging

### Activer les logs JWT

Dans `cognito-jwt.strategy.ts`, ajoutez :

```typescript
super({
  // ... config existante
  passReqToCallback: true,
});
```

### Vérifier le token manuellement

Utilisez [jwt.io](https://jwt.io) pour décoder et inspecter votre token JWT.

## 🚨 Erreurs courantes

### 401 Unauthorized - "No auth token"
- Le header `Authorization` est manquant
- Le format doit être : `Authorization: Bearer <token>`

### 401 Unauthorized - "Invalid token"
- Le token est expiré (durée de vie : 1h par défaut)
- Le token n'est pas signé par Cognito
- L'audience (client_id) ne correspond pas

### 403 Forbidden
- L'utilisateur est authentifié mais n'a pas les permissions nécessaires
- Vérifiez les groupes Cognito si vous utilisez des rôles

## 🎓 Exemples avancés

### Vérifier les groupes Cognito

```typescript
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user.groups.includes('Admins')) {
      throw new ForbiddenException('Admin access required');
    }
    
    return true;
  }
}

// Utilisation
@UseGuards(CognitoJwtAuthGuard, AdminGuard)
@Delete(':id')
async delete(@Param('id') id: string) {
  // Seuls les admins peuvent accéder
}
```

### Récupérer une propriété spécifique

```typescript
@Get('email')
async getEmail(@CurrentUser('email') email: string) {
  return { email };
}
```

## 📚 Ressources

- [Documentation Passport.js](http://www.passportjs.org/)
- [NestJS Authentication](https://docs.nestjs.com/security/authentication)
- [Amazon Cognito JWT Tokens](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-with-identity-providers.html)

## ✅ Checklist de déploiement

- [ ] Variables d'environnement configurées en production
- [ ] CORS configuré pour votre frontend
- [ ] HTTPS activé (obligatoire pour les tokens JWT)
- [ ] Logs d'erreur configurés
- [ ] Rate limiting activé
- [ ] Tokens refresh implémentés côté client
