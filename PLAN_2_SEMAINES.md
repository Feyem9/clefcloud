# 📅 PLAN DE TRAVAIL — CLEFCLOUD (2 SEMAINES)

**Début :** Lundi 24 Février 2026
**Fin :** Vendredi 7 Mars 2026
**Objectif :** Application stable, déployée, prête pour le client.
**Dernière mise à jour :** 20 Février 2026 — 18h00

---

## ✅ PRÉ-TRAVAIL EFFECTUÉ (20 Février 2026)

> Ces tâches ont été réalisées lors de l'audit initial, AVANT le début du plan de 2 semaines.

### Nettoyage infrastructure & code mort
- [x] Supprimer le dossier `terraform/` (IaC AWS)
- [x] Supprimer le dossier `backend/lambda/` (fonctions Lambda AWS)
- [x] Supprimer le dossier `frontend/src/aws/` (config S3/Cognito client)
- [x] Supprimer le dossier `frontend/src/supabase/` (stub inutilisé)
- [x] Supprimer 31 fichiers morts (Cognito guards, AWS module, Express routes, DTOs obsolètes)
- [x] Supprimer `backend/src/verification/` (obsolète AWS)
- [x] Sauvegarder les anciens secrets AWS dans `.env.aws_legacy` (gitignored)
- [x] Mettre à jour le `.gitignore`

### Documentation & Organisation
- [x] Supprimer 13 fichiers de documentation redondants
- [x] Créer `CHANGELOG.md`, `CONTRIBUTING.md`, `CONVERSATION_LOG_INITIAL_AUDIT.md`
- [x] Créer `AUDIT_EXECUTIVE_REPORT.md` (Rapport CEO)
- [x] Créer `PLAN_2_SEMAINES.md` (ce fichier)

### Migration & Nouvelles Features
- [x] Unification Authentification sur Firebase (Front + Back)
- [x] Backend : Firebase Service (Admin SDK) + Auth Guard
- [x] Frontend : Mise à jour AuthContext + api.js (Axios)
- [x] Support Audio MP3 (Entités + Controller + Service + Page Upload)
- [x] Ajout lecteur audio dans la bibliothèque

---

## 🔴 SEMAINE 1 — CONNEXION & NOUVELLES FEATURES (24-28 Fév)

### Jour 1 (Lundi 24) — Connexion Data (Supabase)
- [ ] Initialisation projet Supabase (Postgres).
- [ ] Remplissage du `.env` Backend (clés Firebase Admin + Supabase).
- [ ] Premier test de démarrage serveur avec DB distante.

### Jour 2 (Mardi 25) — Test Auth & Sync Users
- [ ] Test Inscription/Connexion réel avec Google & Email.
- [ ] Vérifier la synchronisation automatique dans la table `users`.

### Jour 3 (Mercredi 26) — Audio & PDF Pro
- [ ] **FEATURE** : Lecteur Audio avancé (Barre de progression, volume).
- [ ] **FEATURE** : PDF Viewer (Zoom, Rotation).

### Jour 4 (Jeudi 27) — Favoris & Recherche
- [ ] **FEATURE** : Système de Favoris persistant.
- [ ] **FEATURE** : Recherche Multi-critères.

### Jour 5 (Vendredi 28) — Profil & Polish
- [ ] Page Profil (Modifier avatar/pseudo).
- [ ] Revue mobile & Dark Mode.

---

## 🟢 SEMAINE 2 — CI/CD & DÉPLOIEMENT (3-7 Mars)

### Jour 6 (Lundi 3) — Automatisation GitHub Actions
- [ ] Pipeline CI/CD (Deploy Front -> Firebase, Deploy Back -> Render).

### Jour 7 (Mardi 4) — Déploiement Backend
- [ ] Mise en ligne sur Render.com.

### Jour 8 (Mercredi 5) — Déploiement Frontend
- [ ] Mise en ligne sur Firebase Hosting.

### Jour 9 (Jeudi 6) — Légal & Nom de Domaine
- [ ] Configuration `clefcloud.com`.
- [ ] Ajout Mentions Légales & Privacy Policy.

### Jour 10 (Vendredi 7) — Livraison
- [ ] Démo finale et transmission des accès.
