# PostgreSQL local (TontineApp)

## Prérequis
- PostgreSQL 18
- Base: `tontineapp`
- Compte: postgres

## Commandes à exécuter (exemple)
1) Créer la base:

CREATE DATABASE tontineapp;

2) Activer l’extension gen_random_uuid (si nécessaire):

CREATE EXTENSION IF NOT EXISTS pgcrypto;

3) Lancer le schéma:

-- fichier: src/db/init.sql
-- ex: psql -U postgres -d tontineapp -f src/db/init.sql


