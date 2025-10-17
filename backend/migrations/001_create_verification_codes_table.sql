-- Migration: Création de la table verification_codes
-- Date: 2025-10-16
-- Description: Table pour stocker les codes de vérification interceptés depuis Cognito

-- Créer les types ENUM
CREATE TYPE verification_event_type AS ENUM (
  'SIGNUP',
  'FORGOT_PASSWORD',
  'RESEND_CODE',
  'VERIFY_ATTRIBUTE',
  'AUTHENTICATION'
);

CREATE TYPE verification_status AS ENUM (
  'PENDING',
  'SENT',
  'FAILED',
  'EXPIRED',
  'USED'
);

-- Créer la table principale
CREATE TABLE verification_codes (
  -- Identifiants
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  user_pool_id VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone_number VARCHAR(50),
  
  -- Code de vérification
  verification_code VARCHAR(10) NOT NULL,
  verification_link TEXT,
  
  -- Type et statut
  event_type verification_event_type NOT NULL,
  status verification_status DEFAULT 'PENDING',
  trigger_source VARCHAR(100) NOT NULL,
  lambda_request_id VARCHAR(255),
  user_attributes JSONB,
  
  -- Envoi d'email
  email_sent_at TIMESTAMP,
  email_provider VARCHAR(50),
  email_message_id VARCHAR(255),
  email_error TEXT,
  
  -- Tentatives
  send_attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMP,
  
  -- Expiration
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  used_by_ip VARCHAR(50),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX idx_verification_codes_email_status ON verification_codes(email, status);
CREATE INDEX idx_verification_codes_user_id ON verification_codes(user_id);
CREATE INDEX idx_verification_codes_created_at ON verification_codes(created_at DESC);
CREATE INDEX idx_verification_codes_expires_at ON verification_codes(expires_at);
CREATE INDEX idx_verification_codes_status ON verification_codes(status);
CREATE INDEX idx_verification_codes_event_type ON verification_codes(event_type);

-- Index composite pour les requêtes fréquentes
CREATE INDEX idx_verification_codes_email_event_status ON verification_codes(email, event_type, status);

-- Fonction de mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER update_verification_codes_updated_at
  BEFORE UPDATE ON verification_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour nettoyer les codes expirés automatiquement
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS INTEGER AS $$
DECLARE
  affected_count INTEGER;
BEGIN
  UPDATE verification_codes
  SET status = 'EXPIRED'
  WHERE status = 'PENDING'
    AND expires_at < NOW();
  
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RETURN affected_count;
END;
$$ language 'plpgsql';

-- Commentaires sur la table et les colonnes
COMMENT ON TABLE verification_codes IS 'Stockage des codes de vérification interceptés depuis AWS Cognito';
COMMENT ON COLUMN verification_codes.verification_code IS 'Code de vérification à 6 chiffres envoyé par Cognito';
COMMENT ON COLUMN verification_codes.event_type IS 'Type d''événement: SIGNUP, FORGOT_PASSWORD, etc.';
COMMENT ON COLUMN verification_codes.status IS 'Statut actuel: PENDING, SENT, FAILED, EXPIRED, USED';
COMMENT ON COLUMN verification_codes.email_provider IS 'Fournisseur d''email utilisé: SES ou SendGrid';
COMMENT ON COLUMN verification_codes.send_attempts IS 'Nombre de tentatives d''envoi (max 3)';
COMMENT ON COLUMN verification_codes.expires_at IS 'Date d''expiration du code (24h pour signup, 1h pour forgot password)';

-- Créer une vue pour les statistiques
CREATE OR REPLACE VIEW verification_stats AS
SELECT
  event_type,
  status,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as last_24h,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour') as last_hour,
  AVG(EXTRACT(EPOCH FROM (email_sent_at - created_at))) as avg_processing_time_seconds
FROM verification_codes
GROUP BY event_type, status;

COMMENT ON VIEW verification_stats IS 'Vue des statistiques des codes de vérification par type et statut';

-- Insérer des données de test (optionnel, à supprimer en production)
-- INSERT INTO verification_codes (
--   user_id, user_pool_id, email, verification_code, 
--   event_type, trigger_source, expires_at
-- ) VALUES (
--   'test-user-123', 'us-east-1_dl0kSgKUl', 'test@example.com', '123456',
--   'SIGNUP', 'CustomMessage_SignUp', NOW() + INTERVAL '24 hours'
-- );

-- Afficher un message de succès
DO $$
BEGIN
  RAISE NOTICE 'Migration 001_create_verification_codes_table.sql appliquée avec succès';
  RAISE NOTICE 'Table verification_codes créée avec % index', (
    SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'verification_codes'
  );
END $$;
