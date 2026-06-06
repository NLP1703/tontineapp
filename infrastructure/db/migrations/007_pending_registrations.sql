-- =====================================================================
-- Migration 007 — Inscriptions en attente de vérification OTP
--   Un utilisateur n'est PLUS créé dans `users` au moment de l'inscription.
--   Tant que l'OTP d'email n'est pas validé, les données restent ici.
--   À la validation (POST /api/auth/otp/verify) : on crée la ligne `users`
--   puis on supprime l'inscription en attente. Sans validation, rien ne
--   persiste dans `users` et l'utilisateur ne peut pas se connecter.
-- Appliquer :
--   psql -U postgres -d tontineapp -f infrastructure/db/migrations/007_pending_registrations.sql
-- =====================================================================

CREATE TABLE IF NOT EXISTS pending_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,        -- re-tenter l'inscription remplace la ligne (nouvel OTP)
  phone TEXT,
  password_hash TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- NB : les comptes non vérifiés créés AVANT cette migration (ancien flux qui
-- insérait l'utilisateur avant l'OTP) ne sont PAS supprimés ici — ils peuvent
-- détenir des données (groupes, paiements). Leur sort est une décision
-- opérationnelle (vérifier les comptes légitimes, supprimer les comptes de test),
-- à exécuter à la main, pas dans le schéma.
