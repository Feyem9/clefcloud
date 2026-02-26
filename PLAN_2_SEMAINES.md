# 📅 PLAN DE TRAVAIL — CLEFCLOUD (2 SEMAINES)

**Début :** Lundi 23 Février 2026
**Fin :** Vendredi 6 Mars 2026
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

## 🔴 SEMAINE 1 — CORE & PAIEMENTS (23-27 Fév)

### Jour 1 à 3 (Lundi 23 - Mercredi 25) — Setup & Auth
- [x] Unification Authentification Firebase (Front + Back).
- [ ] Branchement Supabase (Postgres) — **EN COURS**.
- [ ] Synchronisation des utilisateurs dans la DB.

### Jour 4 (Jeudi 26) — Paiements (PayUnit) & Backend
- [ ] **INTEGRATION** : Initialisation PayUnit SDK/API.
- [ ] **FEATURE** : Création du workflow d'achat "Partition par partition".
- [ ] **FEATURE** : Modèle de données pour les transactions.

### Jour 5 (Vendredi 27) — Système Premium & Souscription
- [ ] **FEATURE** : Système d'abonnement Premium (Accès illimité).
- [ ] **FEATURE** : Logique de vérification des droits d'accès (Abonné vs Achat unique).
- [ ] **UX** : Page de choix (Acheter partition / Passer à Premium).

---

## 🟢 SEMAINE 2 — FEATURES AVANCÉES & DÉPLOIEMENT (2-6 Mars)

### Jour 6 (Lundi 2) — Audio & PDF Pro
- [ ] **FEATURE** : Lecteur Audio avancé (Barre de progression, volume).
- [ ] **FEATURE** : PDF Viewer (Zoom, Rotation).

### Jour 7 (Mardi 3) — Favoris, Recherche & Profil
- [ ] **FEATURE** : Système de Favoris & Recherche multi-critères.
- [ ] **UX** : Page Profil (Modification infos, historique des achats/abonnements).

### Jour 8 (Mercredi 4) — CI/CD & Automatisation
- [ ] Pipeline CI/CD (Deploy Front -> Firebase, Deploy Back -> Render).

### Jour 9 (Jeudi 5) — Déploiement & DNS
- [ ] Mise en ligne (Render + Firebase) & Config `clefcloud.com`.
- [ ] Ajout Mentions Légales & Privacy Policy.

### Jour 10 (Vendredi 6) — Livraison
- [ ] Démo finale et transmission des accès.
