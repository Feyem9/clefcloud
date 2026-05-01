-- Migration: Renommage cognito_sub -> firebase_uid
-- À exécuter en production AVANT le déploiement du nouveau code
-- En développement, TypeORM synchronize gère ça automatiquement

ALTER TABLE users RENAME COLUMN cognito_sub TO firebase_uid;

-- Vérification
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'firebase_uid'
  ) THEN
    RAISE NOTICE '✅ Migration 001 appliquée : cognito_sub renommé en firebase_uid';
  ELSE
    RAISE EXCEPTION '❌ Migration 001 échouée : colonne firebase_uid introuvable';
  END IF;
END $$;
