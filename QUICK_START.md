# ⚡ Quick Start - ClefCloud

## 🚀 Démarrage en 5 minutes

### 1️⃣ Vérifier que tout est installé
```bash
npm run check
```

### 2️⃣ Créer votre projet Firebase

**Allez sur:** https://console.firebase.google.com/

**Cliquez sur:** "Ajouter un projet"

**Activez:**
- ✅ Authentication → Email/Password
- ✅ Firestore Database → Mode test
- ✅ Storage → Mode test

### 3️⃣ Récupérer vos credentials

**Dans Firebase Console:**
1. Paramètres du projet (⚙️)
2. Vos applications → Web (icône `</>`)
3. Copiez les valeurs de `firebaseConfig`

### 4️⃣ Créer le fichier .env

```bash
cp .env.example .env
```

**Éditez `.env` avec vos valeurs:**
```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=votre-projet.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=votre-projet
VITE_FIREBASE_STORAGE_BUCKET=votre-projet.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 5️⃣ Déployer les règles de sécurité

```bash
# Installer Firebase CLI (une seule fois)
npm install -g firebase-tools

# Se connecter
firebase login

# Sélectionner votre projet
firebase use --add

# Déployer les règles
firebase deploy --only firestore:rules,storage:rules
```

### 6️⃣ Lancer l'application

```bash
npm run dev
```

**Ouvrez:** http://localhost:5173

### 7️⃣ Tester

1. **Créer un compte** → Cliquez sur "Inscription"
2. **Ajouter une partition** → Cliquez sur "Ajouter"
3. **Voir vos partitions** → Allez dans "Bibliothèque"
4. **Tester la page Messe** → Sélectionnez une partie

## ✅ Checklist

- [ ] Projet Firebase créé
- [ ] Authentication activée
- [ ] Firestore créée
- [ ] Storage créé
- [ ] Credentials copiés dans `.env`
- [ ] Firebase CLI installé
- [ ] Règles déployées
- [ ] Application lancée (`npm run dev`)
- [ ] Compte créé
- [ ] Première partition ajoutée

## 🎯 Commandes Essentielles

```bash
npm run dev      # Lancer en développement
npm run build    # Build pour production
npm run check    # Vérifier la configuration
```

## 🐛 Problèmes Courants

### "Firebase config not found"
→ Vérifiez que `.env` existe et contient toutes les variables
→ Redémarrez le serveur après avoir modifié `.env`

### "Permission denied"
→ Déployez les règles: `firebase deploy --only firestore:rules,storage:rules`

### "Module not found"
→ Réinstallez: `rm -rf node_modules && npm install`

## 📚 Documentation Complète

Pour plus de détails, consultez:
- `README.md` - Documentation complète
- `GUIDE_DEMARRAGE.md` - Guide détaillé
- `STRUCTURE.md` - Architecture du projet

## 🎉 C'est Parti !

Une fois ces étapes complétées, votre application ClefCloud est **100% fonctionnelle** !

Vous pouvez maintenant sauvegarder toutes vos partitions musicales dans le cloud et y accéder n'importe où, n'importe quand. 🎵
