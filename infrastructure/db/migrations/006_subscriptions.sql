-- =====================================================================
-- Migration 006 — Abonnements Freemium
--   Chaque utilisateur possède (au plus) un abonnement. Le plan du
--   propriétaire d'un groupe limite le nombre de membres de ses groupes.
--   Plans : free (10 membres) | standard (30) | premium (illimité).
-- Appliquer :
--   psql -U postgres -d tontineapp -f infrastructure/db/migrations/006_subscriptions.sql
-- =====================================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free',           -- free | standard | premium
  status TEXT NOT NULL DEFAULT 'active',       -- active | cancelled | expired
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,                       -- NULL = sans expiration (free)
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
