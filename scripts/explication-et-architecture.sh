#!/bin/bash

# Script d'explication de l'architecture du projet ClefCloud

cat << 'EOF'
==============================
 ARCHITECTURE GLOBALE CLEFCLOUD
==============================

1) RACINE DU PROJET
--------------------
- .env / .env.example
  Variables d'environnement globales (Firebase / AWS / autres services).

- README.md
  Présentation fonctionnelle de ClefCloud côté utilisateur + démarrage rapide.

- STRUCTURE.md / INDEX.md / GUIDE_DEMARRAGE.md / PROCHAINES_ETAPES.md / RESUME_PROJET.md
  Documentation métier et technique du FRONTEND Firebase initial.

- ARCHITECTURE_AWS.md / STRUCTURE_FINALE.md
  Documentation d'architecture globale (AWS, migration, vision finale).

- firebase.json / firestore.rules / storage.rules / .firebaserc
  Configuration Firebase (hébergement, règles Firestore et Storage).

- backend/
  API NestJS + logique métier + intégration AWS (Cognito, S3, RDS/PostgreSQL, RabbitMQ, etc.).

- frontend/
  Application React (Vite + Tailwind), interface utilisateur.

- terraform/
  Infrastructure as Code pour AWS (VPC, EC2, RDS, Cognito, S3, ALB, SG, CloudWatch...).

- scripts/
  Scripts shell d'automatisation (déploiement backend, déploiement global, setup AWS).


2) BACKEND (backend/)
----------------------
Objectif : API REST NestJS qui gère authentification, utilisateurs, partitions, emails, etc.

- .env / .env.example
  Variables sensibles (DB, AWS, JWT, mail...). Doit être rempli avant lancement.

- Dockerfile, docker-compose.yml, docker-compose.rabbitmq.yml
  Conteneurisation du backend + services DB / RabbitMQ en local.

- package.json / package-lock.json
  Dépendances et scripts (build, start:dev, test...).

- src/
  Code source NestJS :
  - main.ts
    Bootstrap de l'application Nest (création de l'app, middlewares, port, CORS...).

  - app.module.ts
    Module racine Nest : importe les sous-modules (auth, users, partitions, verification, etc.).

  - auth/
    Gestion de l'authentification et de l'autorisation.
    Probable intégration avec AWS Cognito (JWT, guards, stratégies, décorateurs...).

  - users/
    Gestion des comptes utilisateurs (CRUD, profils, mapping avec Cognito ou DB).

  - partitions/
    Module métier pour les partitions musicales (CRUD, filtrage, catégories, stockage S3 ou DB).

  - verification/
    Logique du système de vérification email (liens, tokens, callbacks Cognito, etc.).

  - mail.module.ts / mail.service.ts
    Envoi d'emails (SES ou autre fournisseur). Utilisé pour la vérification et notifications.

  - aws/
    Intégrations techniques avec les services AWS (S3, Cognito, SNS, etc.).

  - config/
    Chargement et validation de la configuration (env, configuration Nest ConfigModule...).

  - routes/
    Fichier(s) de centralisation des routes / mapping vers les contrôleurs.

  - middleware/
    Middlewares globaux (logging, validation, sécurité...).

  - utils/
    Fonctions utilitaires partagées (helpers).

  - health/
    Endpoints de health-check (pour ALB / monitoring).

Autres fichiers backend utiles :
- migrations/
  Scripts / fichiers de migration de base de données.

- lambda/
  Fonctions Lambda associées (ex: custom messages Cognito).

- test-*.http / test-*.js / test-*.sh
  Fichiers de test manuels (Insomnia/VSCode REST Client, scripts de test d'email, DB, RabbitMQ...).


3) FRONTEND (frontend/)
------------------------
Objectif : interface React/Vite qui consomme soit Firebase directement, soit l'API backend NestJS (via services).

Fichiers principaux :
- package.json / package-lock.json
  Dépendances React, Vite, Tailwind, Firebase, etc.

- vite.config.js / tailwind.config.js / postcss.config.js / eslint.config.js
  Configuration du bundler, du CSS et du linter.

- .env.example
  Variables pour le frontend (config Firebase, API backend, etc.).

- src/
  - main.jsx
    Point d'entrée React (montage de l'app, providers de contexte).

  - App.jsx
    Définition des routes (React Router), Layout global, ProtectedRoute.

  - components/
    Composants réutilisables :
      * Layout/ (Header, Footer, Layout général)
      * ProtectedRoute.jsx (protège les routes privées)
      * PDFViewer.jsx, PartitionCardSkeleton.jsx, etc.

  - contexts/
    * AuthContext.jsx : gestion de l'état d'authentification (Firebase ou autre backend).
    * ThemeContext.jsx : thème clair/sombre, préférences UI.

  - firebase/
    * config.js : initialisation du SDK Firebase (clé API, projectId...).

  - services/
    * api.js : appels vers l'API backend NestJS (si utilisé).
    * storageService.js : interactions avec le stockage (Firebase Storage, S3 via backend...).

  - aws/
    Code éventuel pour parler directement à AWS (rare dans un frontend sécurisé, à vérifier).

  - supabase/
    Expérimentations ou migration potentielle vers Supabase (à clarifier si encore utilisé).

  - pages/
    * Home.jsx, Login.jsx, Signup.jsx, Library.jsx, Upload.jsx, Messe.jsx, Contact.jsx, etc.
      Gèrent les écrans principaux (authentification, bibliothèque, upload, vue messe...).


4) INFRASTRUCTURE (terraform/)
-------------------------------
Objectif : définir toute l'infrastructure AWS de ClefCloud.

- main.tf (+ *.tf.bak)
  Entrée principale de la config Terraform, appels des autres modules/ressources.

- vpc.tf / vpc_us_east_1.tf
  Réseaux VPC, subnets, internet gateway, etc.

- ec2.tf / ec2_backend.tf
  Machines EC2 (serveur backend, éventuels workers).

- rds.tf
  Base de données PostgreSQL (ou autre) managée.

- cognito.tf
  User Pool, Clients, Domain, etc. pour AWS Cognito.

- s3.tf / s3_partitions.tf
  Buckets S3 pour stocker les partitions.

- alb.tf
  Application Load Balancer, intégration health-check, routage vers EC2.

- iam.tf
  Rôles IAM et politiques nécessaires (EC2, RDS, S3, Lambda, CloudWatch...).

- cloudwatch.tf
  Logs et métriques.

- security_groups.tf
  Groupes de sécurité (ports ouverts, restrictions IP).

- terraform.tfvars / terraform.tfvars.example
  Variables d'environnement pour Terraform (nom du projet, CIDR, tailles, etc.).

- user_data.sh
  Script exécuté sur les EC2 au démarrage (installation Node, Docker, pm2, etc.).


5) SCRIPTS (scripts/)
----------------------
- setup-aws.sh
  Préparation du compte AWS (création IAM, clés d'accès, configuration CLI, vérifications).

- deploy-backend.sh
  Build du backend, rsync des fichiers vers EC2, installation des dépendances, restart via pm2.
  Utilise les variables d'env : EC2_HOST, EC2_USER (par défaut ubuntu), SSH_KEY.

- deploy.sh
  Orchestration plus globale (peut lancer Terraform + déploiement backend/front selon le design).

- explication-et-architecture.sh (CE SCRIPT)
  Affiche ce résumé dans le terminal.


6) POINTS CRITIQUES OÙ SURVIENNENT SOUVENT DES ERREURS
------------------------------------------------------

BACKEND :
- Fichier backend/.env manquant ou incomplet
  → Vérifier host/port DB, identifiants, variables Cognito, clés S3, secrets JWT, SMTP.

- Incohérence entre Terraform et le code
  → Ex: nom du User Pool Cognito, IDs de clients, URLs de callback, noms de buckets S3.

- Ports / CORS
  → API écoute bien sur le port 3000 ? CORS autorise le frontend (http://localhost:5173 et domaine prod) ?

- Migrations DB non appliquées
  → Lancer les commandes de migration (selon ORM utilisé : TypeORM/Prisma/sequelize...).

FRONTEND :
- .env frontend non configuré
  → Clés Firebase ou URL de l'API backend manquantes → erreurs au build ou au runtime.

- Conflit entre Firebase et le backend
  → Certaines pages utilisent encore Firebase directement alors que d'autres consomment l'API backend.
  → Décider : soit full Firebase, soit full backend NestJS + AWS.

TERRAFORM / AWS :
- terraform.tfvars non à jour
  → Mauvais noms, régions inconsistantes (eu-west-3 vs us-east-1, etc.).

- Droits IAM insuffisants
  → Backend ne peut pas écrire dans S3 ou envoyer des emails.

SCRIPTS :
- Variables manquantes
  → EC2_HOST, SSH_KEY, etc. doivent être définies avant d'exécuter deploy-backend.sh.


7) ORDRE RECOMMANDÉ POUR DIAGNOSTIQUER LES ERREURS
---------------------------------------------------
1. Vérifier les .env (racine, backend, frontend) et les aligner avec Firebase/AWS.
2. S'assurer que Terraform est appliqué sans erreur (terraform plan / apply) et que les IDs utilisés
   dans le code correspondent bien aux ressources créées.
3. Lancer le backend en local :
   - cd backend
   - npm install
   - npm run start:dev
4. Lancer le frontend en local :
   - cd frontend
   - npm install
   - npm run dev
5. Tester les endpoints du backend via les fichiers test-*.http et vérifier que les réponses sont OK.
6. Tester le flux complet depuis le navigateur (signup/login → upload → affichage des partitions).

EOF
