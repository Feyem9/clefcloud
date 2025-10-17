# 📍 Routes API - ClefCloud Backend

Documentation complète de toutes les routes disponibles.

---

## 🔐 Authentification (`/auth`)

| Méthode | Route | Description | Auth | Body |
|---------|-------|-------------|------|------|
| POST | `/auth/signup` | Inscription d'un nouvel utilisateur | ❌ | `{ email, password, name?, phone? }` |
| POST | `/auth/confirm-signup` | Confirmer l'inscription avec le code | ❌ | `{ email, code }` |
| POST | `/auth/signin` | Connexion utilisateur | ❌ | `{ email, password }` |
| POST | `/auth/forgot-password` | Demander un code de réinitialisation | ❌ | `{ email }` |
| POST | `/auth/confirm-forgot-password` | Confirmer le nouveau mot de passe | ❌ | `{ email, code, newPassword }` |
| POST | `/auth/refresh-token` | Rafraîchir le token d'accès | ❌ | `{ refreshToken, email }` |
| POST | `/auth/resend-confirmation-code` | Renvoyer le code de confirmation | ❌ | `{ email }` |
| GET | `/auth/profile` | Récupérer le profil utilisateur | ✅ | - |
| GET | `/auth/me` | Informations utilisateur connecté | ✅ | - |
| POST | `/auth/change-password` | Changer le mot de passe | ✅ | `{ oldPassword, newPassword }` |
| POST | `/auth/signout` | Déconnexion (invalide tous les tokens) | ✅ | - |
| DELETE | `/auth/account` | Supprimer le compte utilisateur | ✅ | - |

**Total : 12 routes**

---

## 🎵 Partitions (`/partitions`)

| Méthode | Route | Description | Auth | Query Params |
|---------|-------|-------------|------|--------------|
| GET | `/partitions` | Liste des partitions | ❌ | `limit, offset, search, category` |
| GET | `/partitions/:id` | Détails d'une partition | ❌ | - |
| POST | `/partitions/upload` | Upload d'une partition | ✅ | FormData: `file, title, composer, category` |
| GET | `/partitions/:id/download` | URL de téléchargement | ❌ | - |
| DELETE | `/partitions/:id` | Supprimer une partition | ✅ | - |
| POST | `/partitions/:id/favorite` | Ajouter aux favoris | ✅ | - |
| DELETE | `/partitions/:id/favorite` | Retirer des favoris | ✅ | - |
| GET | `/partitions/favorites/list` | Liste des favoris | ✅ | `limit, offset` |
| GET | `/partitions/stats/user` | Statistiques utilisateur | ✅ | - |
| GET | `/partitions/stats/popular` | Partitions populaires | ❌ | `limit` |

**Total : 10 routes**

---

## 👤 Utilisateurs (`/users`)

| Méthode | Route | Description | Auth | Query Params |
|---------|-------|-------------|------|--------------|
| GET | `/users/:id` | Profil d'un utilisateur | ❌ | - |
| GET | `/users/:id/partitions` | Partitions d'un utilisateur | ❌ | `limit, offset` |
| PATCH | `/users/:id` | Mettre à jour le profil | ✅ | `{ name?, avatar_url? }` |

**Total : 3 routes**

---

## 🏥 Health Check (`/health`)

| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| GET | `/health` | État de l'API | ❌ |
| GET | `/health/db` | État de la base de données | ❌ |

**Total : 2 routes**

---

## 📊 Résumé global

**Total des routes : 27**

- 🔐 Authentification : 12 routes
- 🎵 Partitions : 10 routes
- 👤 Utilisateurs : 3 routes
- 🏥 Health : 2 routes

**Routes publiques : 17**  
**Routes protégées : 10**

---

## 🔑 Authentification

### Token JWT

Toutes les routes protégées nécessitent un header `Authorization` :

```
Authorization: Bearer <access_token>
```

### Obtenir un token

```bash
POST /auth/signin
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

Réponse :
```json
{
  "tokens": {
    "accessToken": "eyJraWQiOiJ...",
    "idToken": "eyJraWQiOiJ...",
    "refreshToken": "eyJjdHkiOiJ...",
    "expiresIn": 3600
  }
}
```

### Rafraîchir un token expiré

```bash
POST /auth/refresh-token
{
  "refreshToken": "eyJjdHkiOiJ...",
  "email": "user@example.com"
}
```

---

## 📝 Exemples d'utilisation

### Workflow complet : Inscription → Upload → Favoris

```bash
# 1. Inscription
POST /auth/signup
{
  "email": "musician@example.com",
  "password": "Music123!",
  "name": "John Musician"
}

# 2. Confirmation (code reçu par email)
POST /auth/confirm-signup
{
  "email": "musician@example.com",
  "code": "123456"
}

# 3. Connexion
POST /auth/signin
{
  "email": "musician@example.com",
  "password": "Music123!"
}
# → Récupérer le accessToken

# 4. Upload d'une partition
POST /partitions/upload
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data

file: partition.pdf
title: "Ave Maria"
composer: "Schubert"
category: "messe"

# 5. Voir toutes les partitions
GET /partitions?limit=10&offset=0

# 6. Ajouter une partition aux favoris
POST /partitions/1/favorite
Authorization: Bearer <accessToken>

# 7. Voir ses favoris
GET /partitions/favorites/list
Authorization: Bearer <accessToken>

# 8. Voir ses statistiques
GET /partitions/stats/user
Authorization: Bearer <accessToken>

# 9. Voir les partitions populaires
GET /partitions/stats/popular?limit=5
```

---

## 🔍 Filtres et pagination

### Partitions

```bash
# Pagination
GET /partitions?limit=20&offset=0

# Recherche
GET /partitions?search=Ave

# Filtrer par catégorie
GET /partitions?category=messe

# Combinaison
GET /partitions?search=Ave&category=messe&limit=10
```

### Favoris

```bash
# Pagination des favoris
GET /partitions/favorites/list?limit=20&offset=0
```

### Partitions d'un utilisateur

```bash
# Pagination
GET /users/1/partitions?limit=10&offset=0
```

---

## 📦 Formats de réponse

### Succès

```json
{
  "message": "Success message",
  "data": { ... }
}
```

### Liste paginée

```json
{
  "items": [ ... ],
  "total": 100,
  "limit": 20,
  "offset": 0
}
```

### Erreur

```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Bad Request"
}
```

---

## 🎯 Codes de statut HTTP

| Code | Signification | Utilisation |
|------|---------------|-------------|
| 200 | OK | Requête réussie |
| 201 | Created | Ressource créée |
| 400 | Bad Request | Données invalides |
| 401 | Unauthorized | Non authentifié |
| 403 | Forbidden | Accès refusé |
| 404 | Not Found | Ressource introuvable |
| 409 | Conflict | Conflit (ex: favori déjà existant) |
| 500 | Internal Server Error | Erreur serveur |

---

## 📚 Documentation interactive

La documentation Swagger est disponible à :

```
http://localhost:3000/api
```

Elle permet de :
- ✅ Voir toutes les routes
- ✅ Tester les endpoints directement
- ✅ Voir les schémas de données
- ✅ Gérer l'authentification

---

## 🧪 Tests

### Avec cURL

```bash
# Test simple
curl http://localhost:3000/health

# Avec authentification
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"

# POST avec JSON
curl -X POST http://localhost:3000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Password123!"}'
```

### Avec REST Client (VS Code)

Utilisez le fichier `test-features.http` pour tester toutes les routes.

### Avec Postman

Importez la collection depuis Swagger :
1. Ouvrez `http://localhost:3000/api-json`
2. Copiez le JSON
3. Importez dans Postman

---

## 🔒 Sécurité

### Routes publiques

Ces routes sont accessibles sans authentification :
- Toutes les routes `/auth/*` sauf `/auth/profile`, `/auth/me`, `/auth/change-password`, `/auth/signout`, `/auth/account`
- `/partitions` (liste et détails)
- `/partitions/:id/download`
- `/partitions/stats/popular`
- `/users/:id` et `/users/:id/partitions`
- `/health/*`

### Routes protégées

Ces routes nécessitent un token JWT valide :
- `/auth/profile`, `/auth/me`
- `/auth/change-password`
- `/auth/signout`
- `/auth/account` (DELETE)
- `/partitions/upload`
- `/partitions/:id` (DELETE)
- `/partitions/:id/favorite` (POST/DELETE)
- `/partitions/favorites/list`
- `/partitions/stats/user`
- `/users/:id` (PATCH)

---

## 📞 Support

Pour toute question sur l'API :
- Consultez la documentation Swagger : `http://localhost:3000/api`
- Voir les exemples : `test-features.http`
- Documentation complète : `FEATURES_ADDED.md`
- Guide d'authentification : `src/auth/README.md`

---

## 🎉 Conclusion

L'API ClefCloud offre **27 routes** couvrant tous les besoins d'une application de gestion de partitions musicales :

- ✅ Authentification complète (12 routes)
- ✅ Gestion des partitions (10 routes)
- ✅ Gestion des utilisateurs (3 routes)
- ✅ Monitoring (2 routes)

**Prêt pour la production !** 🚀
