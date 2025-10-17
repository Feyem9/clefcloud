# 🧪 Guide d'utilisation de REST Client pour tester l'API ClefCloud

## 📦 Installation de l'extension

### Méthode 1 : Via l'interface VS Code

1. Ouvrez VS Code
2. Cliquez sur l'icône **Extensions** dans la barre latérale (ou `Ctrl+Shift+X`)
3. Recherchez **"REST Client"**
4. Trouvez l'extension par **Huachao Mao**
5. Cliquez sur **Install**

### Méthode 2 : Via la ligne de commande

```bash
code --install-extension humao.rest-client
```

### Méthode 3 : Via le marketplace

Visitez : https://marketplace.visualstudio.com/items?itemName=humao.rest-client

---

## 🚀 Démarrage rapide

### 1. Démarrer votre serveur

Avant de tester, assurez-vous que votre serveur est démarré :

```bash
# En développement
npm run start:dev

# Ou en production
npm run start:prod
```

Vérifiez que le serveur est accessible :
```bash
curl http://localhost:3000/health
```

### 2. Ouvrir le fichier de tests

Ouvrez le fichier `test-features.http` dans VS Code.

### 3. Exécuter votre première requête

1. Trouvez la section **"AUTHENTIFICATION"**
2. Localisez la requête **"1. Connexion pour obtenir un token"**
3. Vous verrez apparaître un lien **"Send Request"** au-dessus de `POST {{baseUrl}}/auth/signin`
4. Cliquez sur **"Send Request"**

**Raccourci clavier** : `Ctrl+Alt+R` (Windows/Linux) ou `Cmd+Alt+R` (Mac)

---

## 📖 Syntaxe des fichiers .http

### Structure de base d'une requête

```http
### Titre de la requête (optionnel)
METHODE URL
Header1: valeur1
Header2: valeur2

{
  "body": "en JSON"
}
```

### Exemple concret

```http
### Connexion utilisateur
POST http://localhost:3000/auth/signin
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123!"
}
```

### Séparateur de requêtes

Utilisez `###` pour séparer les requêtes :

```http
### Requête 1
GET http://localhost:3000/health

### Requête 2
GET http://localhost:3000/partitions
```

---

## 🔑 Variables

### Définir des variables

Au début du fichier :

```http
@baseUrl = http://localhost:3000
@email = testuser@example.com
@password = Password123!
```

### Utiliser des variables

```http
POST {{baseUrl}}/auth/signin
Content-Type: application/json

{
  "email": "{{email}}",
  "password": "{{password}}"
}
```

### Variables d'environnement

Créez un fichier `.vscode/settings.json` :

```json
{
  "rest-client.environmentVariables": {
    "local": {
      "baseUrl": "http://localhost:3000",
      "email": "test@example.com"
    },
    "production": {
      "baseUrl": "https://api.clefcloud.com",
      "email": "prod@example.com"
    }
  }
}
```

Changez d'environnement avec `Ctrl+Alt+E` (Cmd+Alt+E sur Mac).

---

## 🎯 Extraction de données de réponse

### Nommer une requête

```http
# @name signin
POST {{baseUrl}}/auth/signin
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123!"
}
```

### Extraire des valeurs de la réponse

```http
### Extraire le token
@token = {{signin.response.body.tokens.accessToken}}
@refreshToken = {{signin.response.body.tokens.refreshToken}}
@userId = {{signin.response.body.user.id}}
```

### Utiliser les valeurs extraites

```http
### Utiliser le token dans une autre requête
GET {{baseUrl}}/auth/me
Authorization: Bearer {{token}}
```

---

## 📝 Workflow complet : Test de l'authentification

### Étape 1 : Inscription

```http
### 1. Inscription d'un nouvel utilisateur
# @name signup
POST {{baseUrl}}/auth/signup
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "NewUser123!",
  "name": "New User"
}
```

**Cliquez sur "Send Request"** → Vous devriez recevoir un code par email

### Étape 2 : Confirmation

```http
### 2. Confirmer l'inscription
POST {{baseUrl}}/auth/confirm-signup
Content-Type: application/json

{
  "email": "newuser@example.com",
  "code": "123456"
}
```

**Remplacez "123456"** par le code reçu par email, puis **"Send Request"**

### Étape 3 : Connexion

```http
### 3. Connexion
# @name signin
POST {{baseUrl}}/auth/signin
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "NewUser123!"
}

### Extraire les tokens
@token = {{signin.response.body.tokens.accessToken}}
@refreshToken = {{signin.response.body.tokens.refreshToken}}
```

**"Send Request"** → Les tokens sont automatiquement extraits

### Étape 4 : Tester une route protégée

```http
### 4. Récupérer le profil
GET {{baseUrl}}/auth/me
Authorization: Bearer {{token}}
```

**"Send Request"** → Vous devriez voir vos informations utilisateur

---

## 🎨 Personnalisation de l'affichage

### Paramètres recommandés

Ajoutez dans `.vscode/settings.json` :

```json
{
  "rest-client.enableTelemetry": false,
  "rest-client.followRedirect": true,
  "rest-client.defaultHeaders": {
    "User-Agent": "ClefCloud-API-Tests"
  },
  "rest-client.timeoutinmilliseconds": 10000,
  "rest-client.showResponseInDifferentTab": true,
  "rest-client.previewOption": "full",
  "rest-client.previewResponsePanelTakeFocus": false
}
```

---

## 🔍 Astuces et raccourcis

### Raccourcis clavier

| Action | Windows/Linux | Mac |
|--------|---------------|-----|
| Envoyer la requête | `Ctrl+Alt+R` | `Cmd+Alt+R` |
| Annuler la requête | `Ctrl+Alt+K` | `Cmd+Alt+K` |
| Changer d'environnement | `Ctrl+Alt+E` | `Cmd+Alt+E` |
| Historique des requêtes | `Ctrl+Alt+H` | `Cmd+Alt+H` |

### Commentaires

```http
### Ceci est un titre de section

# Ceci est un commentaire
# @name myRequest (nom de la requête pour extraction)

POST {{baseUrl}}/auth/signin
# Les commentaires peuvent être partout
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123!"
}
```

### Upload de fichiers

```http
### Upload d'une partition
POST {{baseUrl}}/partitions/upload
Authorization: Bearer {{token}}
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="title"

Ave Maria
------WebKitFormBoundary
Content-Disposition: form-data; name="composer"

Schubert
------WebKitFormBoundary
Content-Disposition: form-data; name="file"; filename="partition.pdf"
Content-Type: application/pdf

< ./test-files/partition.pdf
------WebKitFormBoundary--
```

---

## 🐛 Dépannage

### Erreur : "Send Request" n'apparaît pas

**Solution** :
1. Vérifiez que l'extension REST Client est bien installée
2. Assurez-vous que le fichier a l'extension `.http` ou `.rest`
3. Redémarrez VS Code

### Erreur : "Connection refused"

**Solution** :
1. Vérifiez que votre serveur est démarré : `npm run start:dev`
2. Vérifiez l'URL dans `@baseUrl`
3. Testez avec curl : `curl http://localhost:3000/health`

### Erreur : "Invalid token"

**Solution** :
1. Le token a peut-être expiré (durée : 1h)
2. Reconnectez-vous pour obtenir un nouveau token
3. Ou utilisez le refresh token

### Variables non remplacées

**Solution** :
1. Vérifiez la syntaxe : `{{variable}}` (double accolades)
2. Assurez-vous que la variable est définie avant son utilisation
3. Pour les extractions, vérifiez que la requête source a été exécutée

---

## 📊 Exemple complet : Workflow de test

Voici un workflow complet pour tester toutes les fonctionnalités :

```http
@baseUrl = http://localhost:3000

### ========== 1. INSCRIPTION ==========

### 1.1. Inscription
# @name signup
POST {{baseUrl}}/auth/signup
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "Test123!",
  "name": "Test User"
}

### 1.2. Confirmation (utilisez le code reçu par email)
POST {{baseUrl}}/auth/confirm-signup
Content-Type: application/json

{
  "email": "test@example.com",
  "code": "VOTRE_CODE_ICI"
}

### ========== 2. CONNEXION ==========

### 2.1. Connexion
# @name signin
POST {{baseUrl}}/auth/signin
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "Test123!"
}

### Extraction automatique des tokens
@token = {{signin.response.body.tokens.accessToken}}
@refreshToken = {{signin.response.body.tokens.refreshToken}}

### 2.2. Vérifier le profil
GET {{baseUrl}}/auth/me
Authorization: Bearer {{token}}

### ========== 3. PARTITIONS ==========

### 3.1. Liste des partitions
GET {{baseUrl}}/partitions?limit=10

### 3.2. Recherche
GET {{baseUrl}}/partitions?search=Ave&category=messe

### 3.3. Ajouter aux favoris
POST {{baseUrl}}/partitions/1/favorite
Authorization: Bearer {{token}}

### 3.4. Mes favoris
GET {{baseUrl}}/partitions/favorites/list
Authorization: Bearer {{token}}

### ========== 4. STATISTIQUES ==========

### 4.1. Mes statistiques
GET {{baseUrl}}/partitions/stats/user
Authorization: Bearer {{token}}

### 4.2. Partitions populaires
GET {{baseUrl}}/partitions/stats/popular?limit=5

### ========== 5. GESTION DU COMPTE ==========

### 5.1. Changer le mot de passe
POST {{baseUrl}}/auth/change-password
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "oldPassword": "Test123!",
  "newPassword": "NewTest123!"
}

### 5.2. Rafraîchir le token
POST {{baseUrl}}/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "{{refreshToken}}",
  "email": "test@example.com"
}

### 5.3. Déconnexion
POST {{baseUrl}}/auth/signout
Authorization: Bearer {{token}}
```

---

## 🎯 Conseils pour les tests

### 1. Testez dans l'ordre

Suivez l'ordre logique :
1. Inscription → Confirmation → Connexion
2. Ensuite testez les routes protégées
3. Terminez par les actions destructives (suppression)

### 2. Utilisez des données de test

Créez des utilisateurs de test dédiés :
- `test1@example.com`
- `test2@example.com`
- etc.

### 3. Sauvegardez vos tokens

Les tokens extraits automatiquement sont réutilisables dans toutes les requêtes suivantes.

### 4. Vérifiez les logs du serveur

Gardez un œil sur les logs du serveur pendant les tests :
```bash
npm run start:dev
```

---

## 📚 Ressources

- [Documentation REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)
- [Documentation API ClefCloud](./API_ROUTES.md)
- [Guide de déploiement](./DEPLOYMENT_GUIDE.md)

---

## 🎉 Vous êtes prêt !

Vous pouvez maintenant tester toute votre API directement depuis VS Code sans avoir besoin de Postman ou d'autres outils ! 🚀

**Commencez par** :
1. Installer l'extension REST Client
2. Ouvrir `test-features.http`
3. Démarrer votre serveur
4. Cliquer sur "Send Request" sur la première requête

Bon test ! 🧪
