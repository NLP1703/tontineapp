-- ---------------------------------------------------------------------
-- 005 — Jour de cotisation récurrent + date de bouffe par membre
--   * tontines.payment_day      : jour récurrent de cotisation.
--       - frequency = monthly  -> jour du mois (1..28)
--       - frequency = weekly/biweekly -> jour de la semaine (1=lundi..7=dimanche)
--   * tontine_members.payout_date : date à laquelle ce membre reçoit la cagnotte
--       (« date de bouffe »), fixée par le créateur depuis la page du groupe.
-- ---------------------------------------------------------------------
ALTER TABLE tontines
  ADD COLUMN IF NOT EXISTS payment_day INT;

ALTER TABLE tontine_members
  ADD COLUMN IF NOT EXISTS payout_date DATE;
