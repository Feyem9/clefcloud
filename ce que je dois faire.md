# Actions à faire pour le déploiement

Voici les étapes restantes pour mettre ton projet en ligne. Tout est configuré, il ne manque plus que tes accès personnels.

## 1. Configurer les Secrets GitHub (Frontend & Tests)

Dès que tu auras pull le projet chez toi et que tu l'auras push sur **ton propre dépôt GitHub**, va dans **Settings > Secrets and variables > Actions** et ajoute ces secrets :

### Pour Firebase Hosting (Déploiement Frontend)
- `FIREBASE_SERVICE_ACCOUNT` : Copie le contenu JSON de ta clé de compte de service.
- `FIREBASE_PROJECT_ID` : Ton ID de projet Firebase.
- `FIREBASE_API_KEY` : Ta clé API Firebase.
- `FIREBASE_AUTH_DOMAIN` : Ton domaine d'authentification.
- `FIREBASE_STORAGE_BUCKET` : Ton bucket de stockage.
- `FIREBASE_MESSAGING_SENDER_ID` : Ton ID d'expéditeur de messages.
- `FIREBASE_APP_ID` : Ton ID d'application.

<!-- 

VITE_FIREBASE_API_KEY=AIzaSyAV3PrnBzzWYT3Rc1z7T8mmzJUBDShpaG4
VITE_FIREBASE_AUTH_DOMAIN=clefcloud-18253.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=clefcloud-18253
VITE_FIREBASE_STORAGE_BUCKET=clefcloud-18253.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=228444759527
VITE_FIREBASE_APP_ID=1:228444759527:web:1a4a83469e9054d715c942
VITE_FIREBASE_MEASUREMENT_ID=G-9ER067Z85T

 -->

### Pour le lien avec le Backend
- `RENDER_BACKEND_URL` : L'URL de ton API sur Render (ex: `https://clefcloud-backend.onrender.com/api`).

---

## 2. Configurer Render (Backend)

1. Va sur [Render.com](https://render.com).
2. Clique sur **New > Blueprint**.
3. Connecte ton dépôt GitHub.
4. Render va détecter le fichier `render.yaml`.
5. Remplis les variables d'environnement demandées (DB_HOST, DB_PASSWORD, etc.) à partir de tes accès Supabase et ton Admin SDK Firebase.
6. Valide. Render va builder (`npm install && npm run build`) et lancer le serveur.

---

## 3. Mise à jour finale du fichier workflow

Dans le fichier `.github/workflows/deploy.yml`, à la ligne 67, remplace `clefcloud-xxxxx` par ton **vrai** ID de projet Firebase.

```yaml
67:           projectId: ton-id-projet-ici
```

---

## 🚀 C'est tout !
Une fois ces étapes faites, chaque `git push origin master` lancera :
1. Le lancement des tests unitaires et E2E.
2. Le déploiement de l'API sur Render.
3. Le déploiement du site sur Firebase Hosting.

Bonne continuation sur ClefCloud ! 🎵
