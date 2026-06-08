-- =====================================================================
-- Migration 009 — Module Admin : rôles utilisateurs, soft delete, audit
-- À exécuter sur la base partagée `tontineapp`.
--   psql -U postgres -d tontineapp -f infrastructure/db/migrations/009_admin_roles_audit.sql
-- Idempotente (IF NOT EXISTS / DO $$) : ré-exécutable sans erreur.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Rôle utilisateur (géré par auth-service).
-- 'member'      : utilisateur standard
-- 'group_admin' : rôle réservé/futur (gestion déléguée d'un groupe) — pas
--                 encore utilisé par les routes, conservé pour l'évolutivité.
-- 'super_admin' : administrateur de la plateforme (accès au module Admin)
-- ---------------------------------------------------------------------
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'member';

-- Contrainte CHECK ajoutée séparément pour rester idempotent.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_role_check
      CHECK (role IN ('member', 'group_admin', 'super_admin'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ---------------------------------------------------------------------
-- Soft delete : un compte désactivé ne peut plus se connecter mais ses
-- données (cotisations, appartenance aux groupes) restent intègres.
-- ---------------------------------------------------------------------
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- ---------------------------------------------------------------------
-- Journal d'audit : trace toute action d'administration (qui, quoi, sur
-- quoi). Écrit par auth-service ET tontine-service (base partagée).
-- `details` en JSONB pour stocker un contexte libre par action.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,                 -- ex: 'user.role.update', 'group.dissolve'
  target_type TEXT NOT NULL,            -- ex: 'user', 'group', 'transaction'
  target_id TEXT,                       -- identifiant de la cible (UUID en texte)
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
