-- =====================================================================
-- Migration 002 — Détails de paiement
--   * Numéro qui effectue le dépôt (sender_phone)
--   * Numéro qui reçoit le dépôt (receiver_phone)
-- Appliquer :
--   psql -U postgres -d tontineapp -f infrastructure/db/migrations/002_payment_sender_receiver.sql
-- =====================================================================

-- Numéro mobile money qui envoie la cotisation.
ALTER TABLE payments ADD COLUMN IF NOT EXISTS sender_phone TEXT;
-- Numéro mobile money qui reçoit la cotisation (bénéficiaire / collecteur).
ALTER TABLE payments ADD COLUMN IF NOT EXISTS receiver_phone TEXT;
