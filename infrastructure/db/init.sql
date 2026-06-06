-- =====================================================================
-- PostgreSQL schema for TontineApp (db name: tontineapp)
-- Schéma partagé par les 3 microservices (auth, tontine, notification)
-- Exécuter dans l'ordre.
--   psql -U postgres -d tontineapp -f infrastructure/db/init.sql
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------
-- Utilisateurs (géré par auth-service)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone ON users(phone) WHERE phone IS NOT NULL;

-- ---------------------------------------------------------------------
-- OTP (réinitialisation de mot de passe, géré par auth-service)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  purpose TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_otps_user ON otps(user_id);

-- ---------------------------------------------------------------------
-- Inscriptions en attente de vérification OTP (cf. migration 007)
-- Tant que l'OTP n'est pas validé, l'utilisateur n'existe pas dans `users`.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pending_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  password_hash TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- Tontines (groupes) — géré par tontine-service
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tontines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  contribution_amount NUMERIC(20,2) NOT NULL DEFAULT 0,
  frequency TEXT NOT NULL DEFAULT 'monthly',  -- monthly | weekly | biweekly
  current_cycle INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active',       -- active | completed | paused
  max_members INT,                            -- capacité choisie (cf. migration 008) ; NULL = plafond du plan seul
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tontines_owner ON tontines(owner_user_id);

-- ---------------------------------------------------------------------
-- Membres d'une tontine + ordre de rotation
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tontine_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tontine_id UUID NOT NULL REFERENCES tontines(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rotation_order INT NOT NULL,
  received_at TIMESTAMPTZ,                      -- NULL = n'a pas encore reçu la cagnotte
  reliability_score NUMERIC(6,2) NOT NULL DEFAULT 100,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tontine_id, user_id),
  UNIQUE (tontine_id, rotation_order)
);
CREATE INDEX IF NOT EXISTS idx_members_tontine ON tontine_members(tontine_id);
CREATE INDEX IF NOT EXISTS idx_members_user ON tontine_members(user_id);

-- ---------------------------------------------------------------------
-- Cotisations (paiements) — géré par tontine-service
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tontine_id UUID NOT NULL REFERENCES tontines(id) ON DELETE CASCADE,
  cycle INT NOT NULL DEFAULT 1,
  amount NUMERIC(20,2) NOT NULL,
  days_late INT NOT NULL DEFAULT 0,             -- utilisé par l'algo de fiabilité (Innovation)
  status TEXT NOT NULL DEFAULT 'pending',       -- pending | paid | late
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payments_tontine ON payments(tontine_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);

-- ---------------------------------------------------------------------
-- Notifications — géré par notification-service
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',            -- info | payment | reminder | alert
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- ---------------------------------------------------------------------
-- Journal d'activité — partagé
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_id);

-- ---------------------------------------------------------------------
-- Abonnements Freemium — géré par tontine-service (cf. migration 006)
-- Le plan du propriétaire d'un groupe limite le nombre de membres :
-- free = 10, standard = 30, premium = illimité.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free',           -- free | standard | premium
  status TEXT NOT NULL DEFAULT 'active',       -- active | cancelled | expired
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
