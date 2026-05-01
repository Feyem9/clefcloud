# Module Auth — ClefCloud

Gère l'authentification via Firebase. Le frontend utilise le SDK Firebase directement pour signup/login. Le backend valide uniquement les tokens et synchronise les utilisateurs en base.

## Flux

1. Frontend : signup/login via Firebase SDK → obtient un `idToken`
2. Frontend : envoie `POST /api/auth/validate` avec le token
3. Backend : `FirebaseAuthGuard` valide le token via Firebase Admin SDK
4. Backend : crée ou met à jour l'utilisateur en PostgreSQL
5. Toutes les requêtes suivantes : token en header `Authorization: Bearer <token>`

## Endpoints

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/auth/validate` | Public | Valide le token Firebase et sync l'utilisateur |
| GET | `/auth/profile` | Requis | Profil + stats de l'utilisateur connecté |
| PUT | `/auth/profile` | Requis | Met à jour le nom |
| DELETE | `/auth/profile` | Requis | Supprime le compte (soft delete) |

## Guards

- `FirebaseAuthGuard` — guard global sur toutes les routes
- `@Public()` — décorateur pour exclure une route du guard

## Variables d'environnement

```env
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
FIREBASE_STORAGE_BUCKET=
```
