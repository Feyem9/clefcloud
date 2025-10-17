# 🔄 Migration Firebase → AWS Cognito

## ✅ Ce qui a été fait

### 1. Service API créé (`src/services/api.js`)
- ✅ Communication avec le backend NestJS
- ✅ Gestion automatique des tokens JWT
- ✅ Refresh automatique des tokens expirés
- ✅ Tous les endpoints implémentés :
  - Authentification (signup, signin, logout, etc.)
  - Partitions (CRUD complet)
  - Favoris
  - Statistiques
  - Utilisateurs

### 2. AuthContext migré (`src/contexts/AuthContext.jsx`)
- ✅ Remplacé Firebase par AWS Cognito
- ✅ Nouvelles fonctionnalités :
  - `signup(email, password, phone)` - Inscription avec téléphone obligatoire
  - `confirmSignup(email, code)` - Confirmation par code email
  - `login(email, password)` - Connexion
  - `logout()` - Déconnexion
  - `changePassword(oldPassword, newPassword)` - Changement de mot de passe
  - `forgotPassword(email)` - Mot de passe oublié
  - `resendConfirmationCode(email)` - Renvoyer le code
  - `refreshProfile()` - Rafraîchir le profil

### 3. Configuration
- ✅ `.env.example` créé
- ✅ Variables d'environnement configurées

---

## 📋 Ce qu'il reste à faire

### Étape 1 : Mettre à jour les pages
- [ ] `Login.jsx` - Utiliser le nouveau `login()`
- [ ] `Signup.jsx` - Ajouter le champ téléphone + confirmation
- [ ] `Profile.jsx` - Utiliser le nouveau contexte
- [ ] Autres pages utilisant l'auth

### Étape 2 : Mettre à jour les composants
- [ ] `ProtectedRoute.jsx` - Vérifier la compatibilité
- [ ] Composants utilisant `currentUser`

### Étape 3 : Nettoyer Firebase
- [ ] Supprimer les imports Firebase
- [ ] Supprimer les dépendances Firebase du `package.json`
- [ ] Supprimer les fichiers de configuration Firebase

---

## 🔑 Différences importantes

### Firebase → AWS Cognito

| Fonctionnalité | Firebase | AWS Cognito |
|----------------|----------|-------------|
| **Inscription** | `signup(email, password)` | `signup(email, password, phone)` |
| **Confirmation** | Automatique | Nécessite code email |
| **Connexion** | `login(email, password)` | `login(email, password)` |
| **Google Auth** | ✅ Supporté | ❌ Non implémenté (peut être ajouté) |
| **Token** | Firebase ID Token | JWT (accessToken + refreshToken) |
| **Stockage** | Firebase Storage | AWS S3 |
| **Base de données** | Firestore | PostgreSQL |

### Champs utilisateur

**Avant (Firebase)** :
```javascript
{
  uid: "...",
  email: "...",
  displayName: "..."
}
```

**Maintenant (AWS)** :
```javascript
{
  id: 1,
  email: "...",
  name: "...",
  cognitoSub: "..."
}
```

---

## 🚀 Guide de migration pour les développeurs

### 1. Mettre à jour Login.jsx

**Avant** :
```javascript
const { login } = useAuth();
await login(email, password);
```

**Maintenant** :
```javascript
const { login } = useAuth();
const result = await login(email, password);
// result.success, result.user, result.tokens
```

### 2. Mettre à jour Signup.jsx

**Avant** :
```javascript
const { signup } = useAuth();
await signup(email, password);
```

**Maintenant** :
```javascript
const { signup, confirmSignup } = useAuth();

// 1. Inscription
const result = await signup(email, password, phone);

// 2. Si needsConfirmation = true, demander le code
if (result.needsConfirmation) {
  const code = prompt("Entrez le code reçu par email");
  await confirmSignup(email, code);
}
```

### 3. Accéder à l'utilisateur

**Avant** :
```javascript
const { currentUser } = useAuth();
console.log(currentUser.uid);
```

**Maintenant** :
```javascript
const { currentUser } = useAuth();
console.log(currentUser.id);        // ID de la DB
console.log(currentUser.email);     // Email
console.log(currentUser.name);      // Nom
console.log(currentUser.cognitoSub); // Cognito sub
```

---

## 📦 Dépendances à supprimer

Une fois la migration terminée, supprimer :

```bash
npm uninstall firebase
```

Et supprimer les fichiers :
- `src/firebase/config.js`
- `src/firebase/` (tout le dossier)

---

## ✅ Checklist de migration

- [x] Service API créé
- [x] AuthContext migré
- [ ] Login.jsx mis à jour
- [ ] Signup.jsx mis à jour
- [ ] Profile.jsx mis à jour
- [ ] Library.jsx mis à jour
- [ ] Upload.jsx mis à jour
- [ ] Autres composants mis à jour
- [ ] Tests effectués
- [ ] Dépendances Firebase supprimées

---

**Date de début** : 15 octobre 2025
**Status** : 🟡 En cours (30% complété)
