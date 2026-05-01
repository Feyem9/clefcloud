# 🎵 ClefCloud — Plateforme de partitions musicales

ClefCloud est une plateforme web de sauvegarde et vente de partitions musicales (PDF) avec démos audio. Les partitions sont protégées par des URLs signées temporaires et accessibles uniquement aux utilisateurs autorisés (acheteurs ou abonnés premium).

## Stack technique

- Frontend : React 19 + Vite + TailwindCSS 4 + React Router 7
- Backend : NestJS 10 + TypeORM + PostgreSQL (Supabase)
- Auth : Firebase (Email/Password)
- Stockage : Firebase Storage (URLs signées temporaires)
- Paiement : PayUnit
- Email : SMTP via @nestjs-modules/mailer
- Déploiement : Docker + Render

## Installation

### Backend
```bash
cd backend
npm install
cp .env.example .env   # Remplir les variables requises
npm run start:dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Variables d'environnement requises

Voir `backend/.env.example` pour la liste complète. Les variables critiques au démarrage sont :
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_STORAGE_BUCKET`
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`
- `MAIL_USER`, `MAIL_PASSWORD`, `MAIL_FROM_EMAIL`
- `PAYUNIT_WEBHOOK_SECRET`

## Déploiement production

```bash
NODE_ENV=production   # Désactive TypeORM synchronize
```

Avant le premier déploiement en production après un changement de schéma, exécuter les migrations manuellement. Voir `backend/migrations/`.

## Licence

Propriété de ClefCloud. Tous droits réservés.
