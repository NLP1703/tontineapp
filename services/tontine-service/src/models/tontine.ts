import { pool } from '../db.js';

export interface Tontine {
  id: string;
  owner_user_id: string;
  name: string;
  description: string | null;
  contribution_amount: string;
  frequency: string;
  current_cycle: number;
  status: string;
  payment_deadline: string | null;
  // Jour récurrent de cotisation : jour du mois (1..28) si mensuel,
  // jour de la semaine (1=lundi..7=dimanche) si hebdo/bi-mensuel.
  payment_day: number | null;
  created_at: string;
}

// Liste les tontines où l'utilisateur est propriétaire OU membre.
export async function listForUser(userId: string): Promise<Tontine[]> {
  const res = await pool.query(
    `SELECT DISTINCT t.*
     FROM tontines t
     LEFT JOIN tontine_members m ON m.tontine_id = t.id
     WHERE t.owner_user_id = $1 OR m.user_id = $1
     ORDER BY t.created_at DESC`,
    [userId]
  );
  return res.rows;
}

export async function findById(id: string): Promise<Tontine | undefined> {
  const res = await pool.query('SELECT * FROM tontines WHERE id = $1', [id]);
  return res.rows[0];
}

export async function create(
  ownerUserId: string,
  name: string,
  description: string | null,
  contributionAmount: number,
  frequency: string,
  paymentDay: number | null = null
): Promise<Tontine> {
  const res = await pool.query(
    `INSERT INTO tontines (owner_user_id, name, description, contribution_amount, frequency, payment_day)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [ownerUserId, name, description, contributionAmount, frequency, paymentDay]
  );
  return res.rows[0];
}

// Fixe (ou efface) la date limite de paiement du cycle courant.
export async function setDeadline(
  id: string,
  deadline: string | null
): Promise<Tontine | undefined> {
  const res = await pool.query(
    `UPDATE tontines SET payment_deadline = $2 WHERE id = $1 RETURNING *`,
    [id, deadline]
  );
  return res.rows[0];
}
