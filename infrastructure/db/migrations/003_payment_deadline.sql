-- =====================================================================
-- Migration 003 — Date limite de paiement
--   * Le créateur fixe une échéance de cotisation pour le cycle courant.
-- Appliquer :
--   psql -U postgres -d tontineapp -f infrastructure/db/migrations/003_payment_deadline.sql
-- =====================================================================

ALTER TABLE tontines ADD COLUMN IF NOT EXISTS payment_deadline TIMESTAMPTZ;
