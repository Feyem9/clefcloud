# Configuration Amazon Cognito avec OpenID Connect

Ce guide explique comment configurer l'authentification Amazon Cognito avec `openid-client` dans votre application Node.js.

## 📦 Dépendances installées

Les packages suivants ont été ajoutés à `package.json` :
- `openid-client`: ^5.7.0
- `express-session`: ^1.18.1
- `ejs`: ^3.1.10

## 🚀 Démarrage rapide

### 1. Configuration des variables d'environnement

Créez un fichier `.env` ou mettez à jour votre fichier existant avec les informations suivantes :

```env
# Amazon Cognito Configuration
COGNITO_REGION=us-east-1
COGNITO_USER_POOL_ID=us-east-1_dl0kSgKUl
COGNITO_CLIENT_ID=2pu1v5mpa5eht36m8im2ns40sf
COGNITO_CLIENT_SECRET=<votre_client_secret>
COGNITO_DOMAIN=<votre_user_pool_domain>
REDIRECT_URI=https://clefcloud-18253.web.app/library
LOGOUT_URI=<votre_logout_uri>
SESSION_SECRET=<générez_un_secret_aléatoire_sécurisé>
```

### 2. Mettre à jour le fichier exemple

Ouvrez `cognito-openid-example.js` et remplacez les valeurs suivantes :

- `<client secret>` : Votre secret client Cognito
- `<user pool domain>` : Le domaine de votre User Pool (ex: `clefcloud.auth.us-east-1.amazoncognito.com`)
- `<logout uri>` : L'URL de redirection après déconnexion

### 3. Structure des fichiers

```
backend/
├── cognito-openid-example.js    # Fichier principal avec la configuration OpenID
├── views/
│   └── home.ejs                 # Template de la page d'accueil
├── package.json                 # Dépendances mises à jour
└── COGNITO_SETUP.md            # Ce fichier
```

### 4. Lancer l'application exemple

```bash
node cognito-openid-example.js
```

L'application sera accessible sur `http://localhost:3000`

## 🔧 Fonctionnalités implémentées

### Routes disponibles

1. **`GET /`** - Page d'accueil
   - Affiche le statut d'authentification
   - Affiche les informations utilisateur si connecté

2. **`GET /login`** - Connexion
   - Redirige vers la page de connexion hébergée par Amazon Cognito
   - Génère un nonce et un state pour la sécurité

3. **`GET /library`** - Callback OAuth
   - Gère le retour après authentification
   - Échange le code d'autorisation contre des tokens
   - Récupère les informations utilisateur

4. **`GET /logout`** - Déconnexion
   - Détruit la session locale
   - Redirige vers le endpoint de déconnexion Cognito

### Middleware

- **`checkAuth`** : Vérifie si l'utilisateur est authentifié
- **`express-session`** : Gère les sessions utilisateur

## 🔐 Sécurité

### Points importants :

1. **Ne jamais commiter les secrets** : Utilisez des variables d'environnement
2. **Session secret** : Générez un secret fort et unique
3. **HTTPS en production** : Toujours utiliser HTTPS pour les redirections OAuth
4. **Validation des tokens** : Le client OpenID valide automatiquement les tokens JWT

### Génération d'un secret de session sécurisé :

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🔄 Intégration avec NestJS

Pour intégrer cette configuration dans votre application NestJS existante, vous pouvez :

1. Créer un module d'authentification dédié
2. Utiliser `@nestjs/passport` avec une stratégie personnalisée
3. Créer un service qui encapsule la logique OpenID Client
4. Ajouter des guards pour protéger vos routes

Exemple de structure :

```
src/
├── auth/
│   ├── auth.module.ts
│   ├── auth.service.ts
│   ├── auth.controller.ts
│   ├── strategies/
│   │   └── cognito-oidc.strategy.ts
│   └── guards/
│       └── cognito-auth.guard.ts
```

## 📚 Ressources

- [Documentation openid-client](https://github.com/panva/node-openid-client)
- [Amazon Cognito User Pools](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools.html)
- [OAuth 2.0 Authorization Code Flow](https://oauth.net/2/grant-types/authorization-code/)

## ⚠️ Notes importantes

1. **Redirect URI** : Assurez-vous que l'URL de redirection est configurée dans votre User Pool Cognito
2. **Scopes** : Les scopes `openid`, `email`, et `phone` doivent être activés dans votre User Pool
3. **Client Secret** : Si vous utilisez une application publique (SPA), vous n'aurez pas besoin de client secret
4. **CORS** : Configurez correctement CORS si votre frontend et backend sont sur des domaines différents

## 🐛 Dépannage

### Erreur "redirect_uri_mismatch"
- Vérifiez que l'URL de redirection correspond exactement à celle configurée dans Cognito

### Erreur "invalid_client"
- Vérifiez votre client_id et client_secret

### Session non persistante
- Assurez-vous que les cookies sont activés
- Vérifiez la configuration de `express-session`

### Tokens expirés
- Implémentez un mécanisme de refresh token pour renouveler les tokens automatiquement
