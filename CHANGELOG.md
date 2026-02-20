# 📝 CHANGELOG - CLEFCLOUD

Toutes les modifications majeures apportées à ce projet par les contributeurs doivent être consignées ici.
Format : `[VERSION] - DATE - DÉVELOPPEUR`

---

## [0.2.0-Alpha] - 2026-02-20 - Antigravity (PDG)
- **ACTION :** REFACTOR (Grand Nettoyage "Clean Slate")
- **DÉTAIL :** 
    - Suppression complète de l'infrastructure AWS et Terraform.
    - Suppression des fichiers zombies (.bak, .old, backups).
    - Unification de l'architecture vers Firebase (Auth/Storage) + Supabase (Postgres).
    - Création des guides de contribution et de traçabilité.
- **IMPACT :** Simplification radicale du projet. Prêt pour la collaboration.

---

## [0.1.0] - 2026-02-20 - USER
- **ACTION :** INITIAL AUDIT
- **DÉTAIL :** Audit complet du projet et décision de pivoter hors de AWS vers une stack gratuite.
