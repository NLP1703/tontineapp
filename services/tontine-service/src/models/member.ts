import { pool } from '../db.js';

export interface Member {
  id: string;
  tontine_id: string;
  user_id: string;
  rotation_order: number;
  received_at: string | null;
  reliability_score: string;
  payout_date: string | null;
  full_name?: string;
  phone?: string | null;
}

// Membres triés par ordre de rotation (= ordre où chacun touchera la cagnotte),
// avec le nom et le téléphone de chaque participant.
export async function listByTontine(tontineId: string): Promise<Member[]> {
  const res = await pool.query(
    `SELECT m.*, u.full_name, u.phone
     FROM tontine_members m
     JOIN users u ON u.id = m.user_id
     WHERE m.tontine_id = $1
     ORDER BY m.rotation_order ASC`,
    [tontineId]
  );
  return res.rows;
}

// Identifiants des membres (pour notifier tout le groupe).
export async function listUserIds(tontineId: string): Promise<string[]> {
  const res = await pool.query(
    `SELECT user_id FROM tontine_members WHERE tontine_id = $1`,
    [tontineId]
  );
  return res.rows.map((r) => r.user_id as string);
}

// Nombre de membres d'un groupe (utilisé pour la limite du plan Freemium).
export async function count(tontineId: string): Promise<number> {
  const res = await pool.query(
    `SELECT COUNT(*)::int AS n FROM tontine_members WHERE tontine_id = $1`,
    [tontineId]
  );
  return res.rows[0]?.n ?? 0;
}

export async function isMember(tontineId: string, userId: string): Promise<boolean> {
  const res = await pool.query(
    `SELECT 1 FROM tontine_members WHERE tontine_id = $1 AND user_id = $2`,
    [tontineId, userId]
  );
  return res.rows.length > 0;
}

// Ajoute un membre en lui attribuant le prochain rang de rotation libre.
export async function add(tontineId: string, userId: string): Promise<Member> {
  const res = await pool.query(
    `INSERT INTO tontine_members (tontine_id, user_id, rotation_order)
     VALUES (
       $1, $2,
       COALESCE((SELECT MAX(rotation_order) FROM tontine_members WHERE tontine_id = $1), 0) + 1
     )
     ON CONFLICT (tontine_id, user_id) DO NOTHING
     RETURNING *`,
    [tontineId, userId]
  );
  return res.rows[0];
}

// Retire un membre du groupe. Retourne true si une ligne a été supprimée.
export async function remove(tontineId: string, userId: string): Promise<boolean> {
  const res = await pool.query(
    `DELETE FROM tontine_members WHERE tontine_id = $1 AND user_id = $2`,
    [tontineId, userId]
  );
  return (res.rowCount ?? 0) > 0;
}

export async function updateReliability(
  tontineId: string,
  userId: string,
  score: number
): Promise<void> {
  await pool.query(
    `UPDATE tontine_members SET reliability_score = $3 WHERE tontine_id = $1 AND user_id = $2`,
    [tontineId, userId, score]
  );
}

// Fixe (ou efface) la « date de bouffe » d'un membre : date à laquelle il reçoit
// la cagnotte. Retourne true si le membre existe dans ce groupe.
export async function setPayoutDate(
  tontineId: string,
  userId: string,
  payoutDate: string | null
): Promise<boolean> {
  const res = await pool.query(
    `UPDATE tontine_members SET payout_date = $3 WHERE tontine_id = $1 AND user_id = $2`,
    [tontineId, userId, payoutDate]
  );
  return (res.rowCount ?? 0) > 0;
}
