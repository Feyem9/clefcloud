# 📒 LOG DE CONVERSATION - AUDIT INITIAL & CHANGEMENT DE STRATÉGIE
**Projet :** ClefCloud
**Date :** 20 Février 2026
**Participants :** USER (Propriétaire) & Antigravity (Ingénieur Senior / PDG par intérim)

---

## 1. ÉTAT DES LIEUX (AUDIT DU 20/02/2026)
Le projet a été trouvé dans un état de transition inachevé entre Firebase et AWS.
- **Backend :** NestJS 10 avec intégration AWS Cognito, S3, RDS et RabbitMQ.
- **Frontend :** React 19 + Vite 7 + TailwindCSS 4, utilisant partiellement Firebase Auth.
- **Infrastructure :** Terraform complet pour AWS (VPC, EC2, RDS, Cognito, S3).
- **Problèmes critiques détectés :**
    - Conflit d'authentification (Frontend Firebase vs Backend Cognito).
    - Fuite de secrets (Clés AWS, Firebase, DB commitées dans le `.env`).
    - Risque de perte de données (`synchronize: true` dans TypeORM).
    - Complexité excessive (3 systèmes d'email, 3 systèmes de stockage).
    - 31+ fichiers morts (code zombie AWS, Express routes, DTOs Cognito, etc.).
    - 13 fichiers de documentation redondants.
    - Endpoints admin publics (faille de sécurité).

---

## 2. DÉCISION DU PROPRIÉTAIRE (Pivoting vers "Zéro Coût")
Le propriétaire a décidé d'abandonner AWS pour des raisons de coût et de simplicité.

**Nouvelle Stack Technique validée :**

| Service               | Choix                         | Raison                                      |
| --------------------- | ----------------------------- | ------------------------------------------- |
| **SGBD**              | Supabase (PostgreSQL gratuit) | Conserve la logique TypeORM existante       |
| **Authentification**  | Firebase Auth                 | Gratuit, déjà intégré au projet             |
| **Stockage Fichiers** | Firebase Storage              | Gratuit, robuste, CDN intégré               |
| **Emails**            | Gmail SMTP                    | Déjà configuré pour cette app               |
| **CI/CD**             | GitHub Actions                | Gratuit, intégré à GitHub, zéro maintenance |
| **Hébergement Front** | Firebase Hosting              | Gratuit                                     |
| **Hébergement Back**  | Render.com                    | Gratuit (avec mise en veille)               |

---

## 3. DÉCISION CI/CD (Discussion Jenkins vs GitHub Actions)
Le propriétaire a d'abord souhaité utiliser Jenkins. Après analyse comparative :
- Jenkins nécessite un serveur dédié (coût mensuel), une installation Java, et une maintenance continue.
- GitHub Actions est gratuit, intégré nativement à GitHub, et sans maintenance.
- **Décision finale : GitHub Actions seul** (option 1 — rapide, gratuit, fiable).

---

## 4. NOUVELLES FONCTIONNALITÉS VALIDÉES
- **Audio :** Chaque partition peut avoir un fichier audio associé (MP3). L'upload se fait en même temps que le PDF.
- **Structure de Stockage :** Organisation Firebase Storage par buckets uniques : `partitions/{userId}/{partitionId}/[pdf, mp3, image]`.
- **Collaboration :** Système de revue de code strict. Fichiers `CONTRIBUTING.md` et `CHANGELOG.md` obligatoires pour chaque contributeur.
- **Juridique :** Page "Politique de Confidentialité" à ajouter (RGPD expliqué au propriétaire).
- **Nom de domaine :** Le client souhaite `clefcloud.com`.

---

## 5. OPÉRATIONS EFFECTUÉES LE 20/02/2026

### Supprimé :
- Dossier `terraform/` (IaC AWS)
- Dossier `backend/lambda/` (fonctions Lambda)
- Dossier `frontend/src/aws/` (config S3/Cognito client)
- Dossier `frontend/src/supabase/` (stub inutilisé)
- Dossier `backend/src/aws/` (AwsModule, CognitoService, S3Service)
- Dossier `backend/src/routes/` (Express routes mortes)
- Dossier `backend/src/config/` (config AWS/DB mortes)
- Dossier `backend/src/middleware/` (errorHandler Express)
- Dossier `backend/src/auth/decorators/` (doublon)
- 8 DTOs Cognito obsolètes
- Guards et stratégies Cognito
- RabbitMQ consumer
- Duplicatas mail (dans partitions/dto et health/)
- 9 fichiers .md redondants (COMMENCER_ICI, QUICK_START, etc.)
- `storageService.js`, `firebaseStorageService.js`, `AdminResetPassword.jsx`
- Fichiers `.bak` et `.old`

### Créé :
- `CHANGELOG.md`, `CONTRIBUTING.md`, `CONVERSATION_LOG_INITIAL_AUDIT.md`
- `PLAN_2_SEMAINES.md` (plan jour par jour avec checkboxes)
- `backend/src/firebase/firebase.module.ts` et `firebase.service.ts`
- `backend/src/auth/guards/firebase-auth.guard.ts`
- `backend/src/common/decorators/public.decorator.ts`
- `backend/.env.example` (template Gmail SMTP)
- `.env.aws_legacy` (sauvegarde secrets AWS, gitignored)

### Réécrit :
- `AuthContext.jsx` → 100% Firebase Auth
- `api.js` → Axios + token Firebase
- `auth.service.ts` → Validation token Firebase Admin
- `auth.controller.ts` → Simplifié (validate + profile)
- `auth.module.ts` → Imports Firebase
- `app.module.ts` → Guard global Firebase, sans AWS
- `partitions.service.ts` → Upload PDF + Audio vers Firebase Storage
- `partitions.controller.ts` → FileFieldsInterceptor (pdf + audio)
- `partition.entity.ts` → Champs `audio_url`, `audio_storage_path`, `cover_url`
- `Upload.jsx` → Champ audio MP3
- `Library.jsx` → Lecteur audio HTML5
- `README.md` → Nouvelle stack
- `main.ts` → Retrait logs AWS
- `package.json` → Retrait SDK AWS, ajout firebase-admin

### Sécurisé :
- Anciens secrets AWS sauvés dans `.env.aws_legacy` (gitignored)
- `.gitignore` mis à jour

---

*Fin de la trace de l'audit initial — Le projet passe en phase de stabilisation (Semaine 1 du plan).*
