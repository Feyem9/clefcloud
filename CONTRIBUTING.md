# 🤝 GUIDE DE CONTRIBUTION - CLEFCLOUD

Bienvenue sur le projet ClefCloud ! Pour maintenir une qualité de code irréprochable et une traçabilité sans faille, merci de suivre ces règles.

## 🚀 TRAVAILLER SUR LE PROJET

1. **Branchement** : Ne travaillez jamais directement sur `master`. Créez une branche explicite : `feat/nom-fonctionnalite` ou `fix/nom-bug`.
2. **Qualité** : Lancez le Lint avant de commit (`npm run lint`).
3. **Traçabilité** : APRES chaque modification importante, ajoutez une entrée dans le fichier `CHANGELOG.md` à la racine.
4. **Pull Requests** : Chaque PR doit être revue par au moins un autre contributeur (ou le PDG).

## 🛠️ STACK TECHNIQUE
- **Front :** React 19 + Vite + TailwindCSS 4
- **Back :** NestJS 10 + TypeORM
- **Auth :** Firebase Authentication
- **Storage :** Firebase Storage
- **Database :** Supabase (PostgreSQL)
- **Emails :** Brevo

## 📝 FORMAT DU CHANGELOG
Chaque entrée doit suivre ce modèle :
```markdown
### [VERSION] - DATE - NOM
- **Action** : [FEATURE / FIX / REFACTOR]
- **Détail** : Description précise.
- **Impact** : Fichiers touchés.
```

## 📜 SÉCURITÉ
- Ne JAMAIS commiter de fichiers `.env`.
- Ne JAMAIS commiter de clés privées ou de mots de passe.
- Utilisez toujours le fichier `.env.example` pour les nouvelles variables.

Merci pour votre contribution ! 🎵
