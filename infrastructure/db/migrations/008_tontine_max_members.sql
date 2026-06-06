-- =====================================================================
-- Migration 008 — Capacité d'un groupe (nombre de participants)
--   tontines.max_members : nombre maximum de participants choisi à la
--   création. NULL = pas de plafond propre au groupe (seule la limite du
--   plan d'abonnement du propriétaire s'applique alors).
--   La valeur choisie est elle-même bornée par le plan du propriétaire
--   (Gratuit = 10, Standard = 30, Premium = illimité).
-- Appliquer :
--   psql -U postgres -d tontineapp -f infrastructure/db/migrations/008_tontine_max_members.sql
-- =====================================================================

ALTER TABLE tontines ADD COLUMN IF NOT EXISTS max_members INT;
