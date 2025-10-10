# 📐 Structure du Projet ClefCloud

## 🗂️ Architecture des dossiers

```
ClefCloud/
├── public/                      # Fichiers statiques publics
├── src/                         # Code source de l'application
│   ├── components/              # Composants réutilisables
│   │   ├── Layout/              # Composants de mise en page
│   │   │   ├── Header.jsx       # En-tête avec navigation
│   │   │   ├── Footer.jsx       # Pied de page avec liens sociaux
│   │   │   └── Layout.jsx       # Layout principal (wrapper)
│   │   └── ProtectedRoute.jsx   # HOC pour protéger les routes
│   │
│   ├── contexts/                # Contextes React
│   │   └── AuthContext.jsx      # Gestion de l'authentification
│   │
│   ├── firebase/                # Configuration Firebase
│   │   └── config.js            # Initialisation Firebase SDK
│   │
│   ├── pages/                   # Pages de l'application
│   │   ├── Home.jsx             # Page d'accueil
│   │   ├── Login.jsx            # Page de connexion
│   │   ├── Signup.jsx           # Page d'inscription
│   │   ├── Library.jsx          # Bibliothèque de partitions
│   │   ├── Upload.jsx           # Formulaire d'ajout de partition
│   │   ├── Messe.jsx            # Page spéciale messe avec dropdown
│   │   └── Contact.jsx          # Page de contact
│   │
│   ├── App.jsx                  # Composant racine avec routage
│   ├── main.jsx                 # Point d'entrée de l'application
│   └── index.css                # Styles globaux (Tailwind)
│
├── firestore.rules              # Règles de sécurité Firestore
├── storage.rules                # Règles de sécurité Storage
├── firebase.json                # Configuration Firebase Hosting
├── .firebaserc                  # Projet Firebase actif
├── .env.example                 # Template des variables d'environnement
├── .gitignore                   # Fichiers à ignorer par Git
├── tailwind.config.js           # Configuration Tailwind CSS
├── postcss.config.js            # Configuration PostCSS
├── vite.config.js               # Configuration Vite
├── package.json                 # Dépendances et scripts
├── check-setup.cjs              # Script de vérification de config
├── README.md                    # Documentation principale
├── GUIDE_DEMARRAGE.md           # Guide de démarrage pas à pas
├── PROCHAINES_ETAPES.md         # Roadmap et améliorations
└── STRUCTURE.md                 # Ce fichier (architecture)
```

## 🔄 Flux de données

### Authentification
```
User → Login/Signup Page → AuthContext → Firebase Auth → User State
                                ↓
                         Protected Routes
                                ↓
                         Library/Upload/Messe
```

### Upload de partition
```
User → Upload Form → Firebase Storage (fichier)
                  ↓
              Firestore (métadonnées)
                  ↓
              Library (affichage)
```

### Consultation de partitions
```
User → Library/Messe → Firestore Query → Display Cards
                                ↓
                        Firebase Storage (download URL)
```

## 📦 Composants principaux

### Layout Components

#### `Header.jsx`
- Navigation principale
- Menu utilisateur (avatar, déconnexion)
- Liens vers toutes les pages
- Responsive (burger menu mobile)

#### `Footer.jsx`
- Informations de copyright
- Liens vers réseaux sociaux
- Sticky au bas de la page

#### `Layout.jsx`
- Wrapper pour toutes les pages
- Structure: Header → Content → Footer
- Gestion de la hauteur minimale

### Pages

#### `Home.jsx`
- Page d'accueil marketing
- Présentation des fonctionnalités
- CTA vers inscription/connexion
- Section "Pourquoi ClefCloud?"

#### `Login.jsx` & `Signup.jsx`
- Formulaires d'authentification
- Validation des champs
- Gestion des erreurs
- Option Google Sign-In
- Redirection après succès

#### `Library.jsx`
- Liste de toutes les partitions de l'utilisateur
- Filtres: recherche, catégorie, partie de messe
- Cartes de partitions avec métadonnées
- Actions: ouvrir, supprimer
- État vide avec CTA

#### `Upload.jsx`
- Formulaire d'ajout de partition
- Champs: titre, compositeur, tonalité, catégorie, tags
- Dropdown conditionnel pour partie de messe
- Upload de fichier (PDF, PNG, JPG)
- Validation et feedback

#### `Messe.jsx`
- Dropdown de sélection de partie liturgique
- Affichage des partitions filtrées
- Optimisé pour utilisation en direct (messe)
- Accès rapide aux partitions

#### `Contact.jsx`
- Formulaire de contact
- Champs: nom, email, sujet, message
- Simulation d'envoi (à connecter à un service)
- Informations de contact

### Contexts

#### `AuthContext.jsx`
- Gestion de l'état d'authentification
- Fonctions: signup, login, logout, loginWithGoogle
- Écoute des changements d'état (onAuthStateChanged)
- Fournit currentUser à toute l'app

### Utilities

#### `ProtectedRoute.jsx`
- HOC pour protéger les routes privées
- Redirige vers /login si non authentifié
- Utilisé pour Library, Upload, Messe

## 🔥 Firebase Structure

### Firestore Collections

#### `partitions`
```javascript
{
  id: "auto-generated",
  title: "Ave Maria",
  composer: "Schubert",
  key: "Do majeur",
  category: "messe" | "concert" | "autre",
  messePart: "Communion" | null,
  tags: ["classique", "liturgique"],
  storagePath: "partitions/{uid}/filename.pdf",
  downloadURL: "https://...",
  createdBy: "user-uid",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### `users` (optionnel)
```javascript
{
  id: "user-uid",
  displayName: "John Doe",
  email: "john@example.com",
  role: "user" | "admin",
  createdAt: Timestamp
}
```

### Storage Structure
```
partitions/
  └── {userId}/
      ├── 1234567890_Ave_Maria.pdf
      ├── 1234567891_Gloria.pdf
      └── ...
```

## 🛡️ Sécurité

### Firestore Rules
- Lecture: seulement si `createdBy == auth.uid`
- Écriture: seulement si `createdBy == auth.uid`
- Pas d'accès public

### Storage Rules
- Lecture/Écriture: seulement dans son propre dossier `{userId}/`
- Limite de taille: 10MB
- Types autorisés: PDF, images

## 🎨 Styling

### Tailwind CSS
- Utility-first CSS framework
- Configuration personnalisée dans `tailwind.config.js`
- Couleurs primaires: bleu (primary-*)
- Responsive: mobile-first

### Thème
- Couleur principale: Bleu (#0ea5e9)
- Fond: Gris clair (#f9fafb)
- Cartes: Blanc avec ombres
- Boutons: Arrondis avec transitions

## 🚀 Scripts disponibles

```bash
npm run dev      # Lancer en développement (port 5173)
npm run build    # Build pour production (→ dist/)
npm run preview  # Preview du build de production
npm run lint     # Linter ESLint
npm run check    # Vérifier la configuration
```

## 🔌 Intégrations

### Firebase Services
- **Authentication**: Email/Password + Google
- **Firestore**: Base de données NoSQL
- **Storage**: Stockage de fichiers
- **Hosting**: Hébergement de l'application

### Libraries
- **React 19**: Framework UI
- **React Router v7**: Routage
- **Vite**: Build tool
- **Tailwind CSS v4**: Styling
- **Firebase SDK v12**: Backend

## 📱 Responsive Design

### Breakpoints Tailwind
- `sm`: 640px (mobile landscape)
- `md`: 768px (tablette)
- `lg`: 1024px (desktop)
- `xl`: 1280px (large desktop)

### Adaptations
- Header: burger menu sur mobile
- Grilles: 1 col mobile → 2 cols tablette → 3 cols desktop
- Formulaires: full width mobile → max-width desktop

## 🔄 État de l'application

### Global State
- **AuthContext**: État d'authentification (currentUser)

### Local State
- Chaque page gère son propre état local
- Formulaires: useState pour les champs
- Listes: useState + useEffect + Firestore listeners

### Real-time Updates
- Utilisation de `onSnapshot` pour les mises à jour en temps réel
- Les partitions se mettent à jour automatiquement

## 🧪 Points d'extension

### Facile à ajouter
- Nouvelles pages (créer dans `src/pages/`)
- Nouveaux composants (créer dans `src/components/`)
- Nouvelles routes (ajouter dans `App.jsx`)
- Nouveaux contextes (créer dans `src/contexts/`)

### Patterns utilisés
- Context API pour l'état global
- Custom hooks possibles (ex: `usePartitions`)
- HOC pour les routes protégées
- Composition de composants

## 📊 Performance

### Optimisations actuelles
- Lazy loading des images
- Firestore queries indexées
- Vite pour un build optimisé
- Tailwind CSS purge en production

### Optimisations futures possibles
- Code splitting par route
- Image compression
- Service Worker (PWA)
- Caching stratégique

## 🔍 Debugging

### Outils
- React DevTools
- Firebase Console (données en temps réel)
- Browser DevTools (Network, Console)
- Vite HMR (Hot Module Replacement)

### Logs
- Console.error pour les erreurs
- Firebase Auth errors
- Firestore errors
- Storage upload errors

---

Cette structure est conçue pour être **simple**, **maintenable** et **extensible**. Chaque composant a une responsabilité unique et l'architecture permet d'ajouter facilement de nouvelles fonctionnalités.
