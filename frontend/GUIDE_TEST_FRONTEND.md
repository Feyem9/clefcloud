# 🧪 Guide de test du Frontend - ClefCloud

## ✅ Migration terminée !

**5/5 pages principales migrées vers AWS Cognito + Backend NestJS**

---

## 🚀 Démarrage

### 1. Backend (Terminal 1)
```bash
cd backend
npm run start:dev
# Backend sur http://localhost:3000
```

### 2. Frontend (Terminal 2)
```bash
cd frontend
npm install  # Si pas encore fait
npm run dev
# Frontend sur http://localhost:5173
```

---

## 📋 Tests à effectuer

### Test 1 : Inscription (Signup)
**URL** : `http://localhost:5173/signup`

**Étapes** :
1. Remplir le formulaire :
   - Email : `test@example.com`
   - Téléphone : `+237683845543` (format international obligatoire)
   - Mot de passe : `TestPassword123!` (min 8 caractères)
   - Confirmation : `TestPassword123!`

2. Cliquer sur "S'inscrire"

3. **Résultat attendu** :
   - ✅ Message de succès : "Inscription réussie ! Un code de confirmation a été envoyé à votre email."
   - ✅ Le formulaire change pour demander le code de confirmation

4. Entrer le code reçu par email (ou utiliser admin-confirm dans le backend)

5. **Résultat attendu** :
   - ✅ Message : "Email confirmé ! Vous pouvez maintenant vous connecter."
   - ✅ Redirection vers `/login` après 2 secondes

**Alternative (sans email)** :
```bash
# Dans le backend, confirmer manuellement
cd backend
# Utiliser test-features.http section "0. Inscription"
# Ou via AWS Console Cognito
```

---

### Test 2 : Connexion (Login)
**URL** : `http://localhost:5173/login`

**Étapes** :
1. Entrer les identifiants :
   - Email : `test@example.com`
   - Mot de passe : `TestPassword123!`

2. Cliquer sur "Se connecter"

3. **Résultat attendu** :
   - ✅ Connexion réussie
   - ✅ Redirection vers `/library`
   - ✅ Token stocké dans localStorage

**Vérification** :
```javascript
// Dans la console du navigateur (F12)
localStorage.getItem('accessToken')  // Doit retourner un token JWT
localStorage.getItem('user')         // Doit retourner les infos utilisateur
```

---

### Test 3 : Profil (Profile)
**URL** : `http://localhost:5173/profile`

**Étapes** :
1. Accéder à la page profil (après connexion)

2. **Résultat attendu** :
   - ✅ Affichage du nom de l'utilisateur
   - ✅ Affichage de l'email
   - ✅ Statistiques affichées :
     - Total Partitions
     - Téléchargements
     - Vues
     - Favoris

3. Cliquer sur "Déconnexion"

4. **Résultat attendu** :
   - ✅ Déconnexion réussie
   - ✅ Redirection vers `/`
   - ✅ Tokens supprimés du localStorage

---

### Test 4 : Upload de partition
**URL** : `http://localhost:5173/upload`

**Étapes** :
1. Remplir le formulaire :
   - Titre : `Ave Maria`
   - Compositeur : `Schubert`
   - Tonalité : `Do majeur`
   - Catégorie : `Messe`
   - Partie de la messe : `Communion`
   - Tags : `classique, liturgique`
   - Fichier : Sélectionner un PDF

2. Cliquer sur "Ajouter la partition"

3. **Résultat attendu** :
   - ✅ Message : "Partition ajoutée avec succès !"
   - ✅ Formulaire réinitialisé
   - ✅ Redirection vers `/library` après 2 secondes

**Vérification backend** :
```bash
# Dans le backend
# Vérifier que le fichier est dans S3
# Vérifier que l'entrée est dans PostgreSQL
```

---

### Test 5 : Bibliothèque (Library)
**URL** : `http://localhost:5173/library`

**Étapes** :
1. Accéder à la bibliothèque

2. **Résultat attendu** :
   - ✅ Liste des partitions affichée
   - ✅ Filtres fonctionnels :
     - Recherche par titre/compositeur
     - Filtre par catégorie
     - Filtre par partie de messe
     - Filtre "Mes partitions uniquement"

3. Cliquer sur "Voir" sur une partition

4. **Résultat attendu** :
   - ✅ Modal PDF s'ouvre
   - ✅ PDF affiché correctement
   - ✅ URL S3 signée utilisée

5. Cliquer sur le bouton de téléchargement

6. **Résultat attendu** :
   - ✅ Fichier téléchargé
   - ✅ Nouvelle fenêtre/onglet avec le PDF

7. Cliquer sur "Supprimer" (seulement sur vos partitions)

8. **Résultat attendu** :
   - ✅ Confirmation demandée
   - ✅ Partition supprimée
   - ✅ Liste mise à jour

---

## 🔍 Vérifications techniques

### Vérifier les tokens JWT
```javascript
// Console navigateur (F12)
const token = localStorage.getItem('accessToken');
console.log('Token:', token);

// Décoder le token (sans vérification)
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Payload:', payload);
// Doit contenir: sub, email, exp, iat
```

### Vérifier les appels API
```javascript
// Ouvrir l'onglet Network (F12)
// Filtrer par "Fetch/XHR"
// Vérifier que tous les appels vont vers http://localhost:3000/api
// Vérifier que le header Authorization est présent
```

### Vérifier le refresh automatique des tokens
```javascript
// Attendre que le token expire (ou modifier l'expiration dans le backend)
// Faire une action (ex: charger les partitions)
// Le token doit être rafraîchi automatiquement
```

---

## ❌ Problèmes courants

### Problème 1 : "Unauthorized" lors de la connexion
**Cause** : Token invalide ou expiré
**Solution** :
```javascript
// Nettoyer le localStorage
localStorage.clear();
// Se reconnecter
```

### Problème 2 : "User not found" lors de l'upload
**Cause** : L'utilisateur n'existe pas en DB
**Solution** :
```bash
# Se reconnecter pour créer l'utilisateur en DB
# Ou vérifier que l'utilisateur existe dans PostgreSQL
```

### Problème 3 : CORS Error
**Cause** : Backend pas démarré ou mauvaise URL
**Solution** :
```bash
# Vérifier que le backend tourne sur http://localhost:3000
# Vérifier VITE_API_URL dans frontend/.env
```

### Problème 4 : "Cannot read property 'name' of null"
**Cause** : `currentUser` est null
**Solution** :
```javascript
// Vérifier que l'utilisateur est connecté
// Vérifier que le token est valide
// Se reconnecter si nécessaire
```

---

## 📊 Checklist complète

### Authentification
- [ ] Inscription avec téléphone
- [ ] Confirmation par code email
- [ ] Connexion avec email/password
- [ ] Déconnexion
- [ ] Refresh automatique des tokens
- [ ] Protection des routes (redirection si non connecté)

### Profil
- [ ] Affichage du nom et email
- [ ] Statistiques affichées
- [ ] Déconnexion fonctionne

### Upload
- [ ] Formulaire complet
- [ ] Validation des champs
- [ ] Upload vers S3 via backend
- [ ] Redirection après succès

### Bibliothèque
- [ ] Liste des partitions
- [ ] Filtres fonctionnels
- [ ] Visualisation PDF
- [ ] Téléchargement
- [ ] Suppression (seulement vos partitions)

### Technique
- [ ] Tokens JWT stockés
- [ ] Appels API avec Authorization header
- [ ] Refresh automatique des tokens
- [ ] Gestion des erreurs
- [ ] Messages de succès/erreur

---

## 🎯 Prochaines étapes

1. ✅ Migration terminée
2. ⏳ Tests manuels complets
3. ⏳ Correction des bugs éventuels
4. ⏳ Nettoyage du code (supprimer Firebase/Supabase)
5. ⏳ Documentation finale
6. ⏳ Déploiement

---

**Date** : 15 octobre 2025  
**Status** : ✅ Migration terminée - Prêt pour les tests
