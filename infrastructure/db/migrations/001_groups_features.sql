-- =====================================================================
-- Migration 001 — Fonctionnalités groupes
--   * Téléphone utilisateur (ajout de membre par email OU téléphone)
--   * Rubriques de cotisation par groupe avec montant (SECOURS, COLLATION, ÉPARGNE…)
--   * Rubrique + téléphone (mobile money) sur chaque cotisation
-- Appliquer :
--   psql -U postgres -d tontineapp -f infrastructure/db/migrations/001_groups_features.sql
-- =====================================================================

-- Téléphone utilisateur (unique quand renseigné).
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone ON users(phone) WHERE phone IS NOT NULL;

-- Rubriques de cotisation propres à chaque tontine, avec montant.
CREATE TABLE IF NOT EXISTS tontine_rubrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tontine_id UUID NOT NULL REFERENCES tontines(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                           -- SECOURS | COLLATION | EPARGNE
  amount NUMERIC(20,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tontine_id, name)
);
CREATE INDEX IF NOT EXISTS idx_rubrics_tontine ON tontine_rubrics(tontine_id);

-- Cotisation : rubrique concernée + numéro mobile money utilisé.
ALTER TABLE payments ADD COLUMN IF NOT EXISTS rubric TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS phone TEXT;
