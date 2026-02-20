# 📒 LOG DE CONVERSATION - AUDIT INITIAL & CHANGEMENT DE STRATÉGIE
**Projet :** ClefCloud
**Date :** 20 Février 2026
**Participants :** USER (Propriétaire) & Antigravity (Ingénieur Senior / PDG par intérim)

---

## 1. ÉTAT DES LIEUX (AUDIT DU 20/02/2026)
Le projet a été trouvé dans un état de transition inachevé entre Firebase et AWS.
- **Backend :** NestJS 10 avec intégration AWS Cognito, S3, RDS et RabbitMQ.
- **Frontend :** React 19 + Vite 7 + TailwindCSS 4, utilisant partiellement Firebase Auth (commenté) et préparé pour AWS.
- **Infrastructure :** Terraform complet pour AWS (VPC, EC2, RDS, Cognito, S3).
- **Problèmes critiques détectés :**
    - Conflit d'authentification (Frontend Firebase vs Backend Cognito).
    - Fuite de secrets (Clés AWS, Firebase, DB commitées dans le `.env`).
    - Risque de perte de données (`synchronize: true` dans TypeORM).
    - Complexité excessive (3 systèmes d'email, 3 systèmes de stockage).

---

## 2. DÉCISION DU PROPRIÉTAIRE (Pivoting)
Le propriétaire a décidé d'abandonner AWS pour des raisons de coût et de simplicité, privilégiant une stack **"Zero Cost"** pour le démarrage.

**Nouvelle Stack Technique validée :**
- **SGBD :** Supabase (PostgreSQL gratuit) pour conserver la logique TypeORM existante.
- **Authentification :** Firebase Auth (Gratuit, déjà intégré).
- **Stockage Fichiers :** Firebase Storage (Gratuit, robuste).
- **Emails :** Brevo API (SMTP transactionnel gratuit).
- **CI/CD :** GitHub Actions (Gratuit).
- **Déploiement :** Firebase Hosting (Front) & Render/Fly.io (Back).

---

## 3. NOUVELLES DIRECTIVES ET FONCTIONNALITÉS
- **Audio :** Ajout de la capacité d'écouter et de télécharger un morceau audio lié à chaque partition.
- **Structure de Stockage :** Organisation par buckets uniques par partition : `partitions/{userId}/{partitionId}/[pdf, mp3, image]`.
- **Collaboration :** Mise en place d'un système de revue de code strict et de traçabilité pour les futurs contributeurs.
- **Juridique :** Mise en œuvre des principes du RGPD et d'une politique de confidentialité, même pour le marché camerounais.

---

## 4. FEU VERT POUR LE NETTOYAGE (OPÉRATION "CLEAN SLATE")
Le propriétaire a autorisé la suppression immédiate de :
- Tout le dossier `terraform/`.
- Tous les scripts liés à AWS.
- Tous les fichiers de backup (`.bak`, `.old`).
- Tout le code mort lié à la migration AWS inachevée.
- La dépendance npm parasite `terraform`.

---
*Fin de la trace initiale - Le projet passe maintenant en phase de stabilisation.*
