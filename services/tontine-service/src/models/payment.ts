import { pool } from '../db.js';

export interface Payment {
  id: string;
  user_id: string;
  tontine_id: string;
  cycle: number;
  amount: string;
  days_late: number;
  status: string;
  rubric: string | null;
  sender_phone: string | null;
  receiver_phone: string | null;
  created_at: string;
  // Joint depuis la table users (renseigné par listByTontine).
  full_name?: string;
}

export interface CreatePaymentInput {
  userId: string;
  tontineId: string;
  cycle: number;
  amount: number;
  daysLate?: number;
  rubric?: string | null;
  senderPhone: string;
  receiverPhone: string;
}

export async function create(input: CreatePaymentInput): Promise<Payment> {
  const daysLate = input.daysLate ?? 0;
  const status = daysLate > 0 ? 'late' : 'paid';
  const res = await pool.query(
    `INSERT INTO payments
       (user_id, tontine_id, cycle, amount, days_late, status, rubric, sender_phone, receiver_phone, paid_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
     RETURNING *`,
    [
      input.userId,
      input.tontineId,
      input.cycle,
      input.amount,
      daysLate,
      status,
      input.rubric ?? null,
      input.senderPhone,
      input.receiverPhone,
    ]
  );
  return res.rows[0];
}

// Historique du groupe, enrichi du nom du cotisant pour l'affichage.
export async function listByTontine(tontineId: string): Promise<Payment[]> {
  const res = await pool.query(
    `SELECT p.*, u.full_name
     FROM payments p
     JOIN users u ON u.id = p.user_id
     WHERE p.tontine_id = $1
     ORDER BY p.created_at DESC`,
    [tontineId]
  );
  return res.rows;
}

// Somme cotisée par le groupe : total cumulé (tous cycles) et total du cycle courant.
// Sert à afficher la « cagnotte » visible par tous les membres.
export async function totalsForTontine(
  tontineId: string,
  currentCycle: number
): Promise<{ allTime: number; currentCycle: number }> {
  const res = await pool.query(
    `SELECT
       COALESCE(SUM(amount), 0) AS all_time,
       COALESCE(SUM(amount) FILTER (WHERE cycle = $2), 0) AS current_cycle
     FROM payments WHERE tontine_id = $1`,
    [tontineId, currentCycle]
  );
  const row = res.rows[0];
  return { allTime: Number(row.all_time), currentCycle: Number(row.current_cycle) };
}

// Identifiants des membres ayant déjà cotisé pour un cycle donné
// (sert à afficher « qui a payé » et à cibler les rappels).
export async function paidUserIdsForCycle(
  tontineId: string,
  cycle: number
): Promise<string[]> {
  const res = await pool.query(
    `SELECT DISTINCT user_id FROM payments WHERE tontine_id = $1 AND cycle = $2`,
    [tontineId, cycle]
  );
  return res.rows.map((r) => r.user_id as string);
}

// Récapitulatif des cotisations personnelles d'un utilisateur, tous groupes confondus :
// total cumulé + ventilation par mois (6 derniers mois) + total cotisé par tontine.
// Sert à alimenter le tableau de bord en données RÉELLES (et non plus en valeurs configurées).
export async function userContributionSummary(userId: string): Promise<{
  totalContributed: number;
  monthly: { month: string; amount: number }[];
  perGroup: Record<string, number>;
}> {
  const [totalRes, monthlyRes, perGroupRes] = await Promise.all([
    pool.query(`SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE user_id = $1`, [userId]),
    pool.query(
      `SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS month,
              COALESCE(SUM(amount), 0) AS amount
       FROM payments
       WHERE user_id = $1
         AND created_at >= date_trunc('month', NOW()) - INTERVAL '5 months'
       GROUP BY 1
       ORDER BY 1`,
      [userId]
    ),
    pool.query(
      `SELECT tontine_id, COALESCE(SUM(amount), 0) AS amount
       FROM payments WHERE user_id = $1 GROUP BY tontine_id`,
      [userId]
    ),
  ]);

  const perGroup: Record<string, number> = {};
  for (const r of perGroupRes.rows) perGroup[r.tontine_id as string] = Number(r.amount);

  return {
    totalContributed: Number(totalRes.rows[0].total),
    monthly: monthlyRes.rows.map((r) => ({ month: r.month as string, amount: Number(r.amount) })),
    perGroup,
  };
}

// Historique de paiement d'un membre (utilisé pour le score de fiabilité).
export async function historyForMember(
  tontineId: string,
  userId: string
): Promise<{ daysLate: number }[]> {
  const res = await pool.query(
    `SELECT days_late AS "daysLate" FROM payments
     WHERE tontine_id = $1 AND user_id = $2
     ORDER BY created_at DESC
     LIMIT 12`,
    [tontineId, userId]
  );
  return res.rows;
}
