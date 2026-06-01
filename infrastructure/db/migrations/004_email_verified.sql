-- =====================================================================
-- Migration 004 — Vérification de l'email à l'inscription (OTP)
--   * users.email_verified : l'email est confirmé par code OTP au signup.
--   * Les comptes existants sont considérés vérifiés (pas de blocage).
-- Appliquer :
--   psql -U postgres -d tontineapp -f infrastructure/db/migrations/004_email_verified.sql
-- =====================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false;

-- Ne pas verrouiller les comptes créés avant l'introduction de l'OTP signup.
UPDATE users SET email_verified = true WHERE email_verified = false;
