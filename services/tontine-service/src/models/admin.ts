import { pool } from '../db.js';

// =====================================================================
// Requêtes d'administration (module Admin, cf. migration 009).
// Vue transversale sur TOUTES les tontines / transactions de la plateforme.
// =====================================================================

export interface AdminGroup {
  id: string;
  name: string;
  status: string;
  current_cycle: number;
  contribution_amount: string;
  max_members: number | null;
  created_at: string;
  owner_user_id: string;
  owner_name: string | null;
  member_count: number;
  total_collected: number;
}

// Liste tous les groupes de toutes les tontines, avec propriétaire, nombre de
// membres et cagnotte totale collectée. Trié du plus récent au plus ancien.
export async function listAllGroups(): Promise<AdminGroup[]> {
  const res = await pool.query(
    `SELECT t.id, t.name, t.status, t.current_cycle, t.contribution_amount,
            t.max_members, t.created_at, t.owner_user_id,
            u.full_name AS owner_name,
            COALESCE(mc.n, 0)::int AS member_count,
            COALESCE(pc.total, 0)::float AS total_collected
     FROM tontines t
     LEFT JOIN users u ON u.id = t.owner_user_id
     LEFT JOIN (SELECT tontine_id, COUNT(*) AS n FROM tontine_members GROUP BY tontine_id) mc
            ON mc.tontine_id = t.id
     LEFT JOIN (SELECT tontine_id, SUM(amount) AS total FROM payments GROUP BY tontine_id) pc
            ON pc.tontine_id = t.id
     ORDER BY t.created_at DESC`
  );
  return res.rows;
}

// Supprime (dissout) un groupe. Les membres, cotisations et rubriques sont
// supprimés en cascade (FK ON DELETE CASCADE). Retourne true si une ligne a sauté.
export async function dissolveGroup(id: string): Promise<boolean> {
  const res = await pool.query(`DELETE FROM tontines WHERE id = $1`, [id]);
  return (res.rowCount ?? 0) > 0;
}

// Marque un membre comme ayant reçu la cagnotte (rotation).
export async function markReceived(tontineId: string, userId: string): Promise<void> {
  await pool.query(
    `UPDATE tontine_members SET received_at = NOW()
     WHERE tontine_id = $1 AND user_id = $2`,
    [tontineId, userId]
  );
}

// Clôt le cycle : passe au cycle suivant et remet les réceptions à zéro
// (nouveau tour de rotation).
export async function advanceCycle(tontineId: string): Promise<void> {
  await pool.query(
    `UPDATE tontines SET current_cycle = current_cycle + 1 WHERE id = $1`,
    [tontineId]
  );
  await pool.query(
    `UPDATE tontine_members SET received_at = NULL WHERE tontine_id = $1`,
    [tontineId]
  );
}

export interface AdminTransaction {
  id: string;
  user_id: string;
  tontine_id: string;
  cycle: number;
  amount: string;
  days_late: number;
  status: string;
  rubric: string | null;
  created_at: string;
  full_name: string | null;
  tontine_name: string | null;
}

export interface TransactionFilters {
  from?: string;
  to?: string;
  status?: string;
  tontineId?: string;
}

export interface ListTransactionsResult {
  transactions: AdminTransaction[];
  total: number;
}

// Toutes les transactions de la plateforme avec filtres (date, statut, groupe).
export async function listAllTransactions(
  page: number,
  pageSize: number,
  filters: TransactionFilters = {}
): Promise<ListTransactionsResult> {
  const offset = (page - 1) * pageSize;
  const conds: string[] = [];
  const params: unknown[] = [];

  if (filters.from) {
    params.push(filters.from);
    conds.push(`p.created_at >= $${params.length}`);
  }
  if (filters.to) {
    params.push(filters.to);
    conds.push(`p.created_at <= $${params.length}`);
  }
  if (filters.status) {
    params.push(filters.status);
    conds.push(`p.status = $${params.length}`);
  }
  if (filters.tontineId) {
    params.push(filters.tontineId);
    conds.push(`p.tontine_id = $${params.length}`);
  }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

  const [rows, count] = await Promise.all([
    pool.query(
      `SELECT p.id, p.user_id, p.tontine_id, p.cycle, p.amount, p.days_late,
              p.status, p.rubric, p.created_at,
              u.full_name, t.name AS tontine_name
       FROM payments p
       LEFT JOIN users u ON u.id = p.user_id
       LEFT JOIN tontines t ON t.id = p.tontine_id
       ${where}
       ORDER BY p.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, pageSize, offset]
    ),
    pool.query(`SELECT COUNT(*)::int AS n FROM payments p ${where}`, params),
  ]);

  return { transactions: rows.rows, total: count.rows[0]?.n ?? 0 };
}

// Valide manuellement une cotisation contestée : statut 'paid', retard remis à 0.
export async function validateTransaction(id: string): Promise<AdminTransaction | undefined> {
  const res = await pool.query(
    `UPDATE payments SET status = 'paid', days_late = 0, paid_at = NOW()
     WHERE id = $1
     RETURNING id, user_id, tontine_id, cycle, amount, days_late, status, rubric, created_at`,
    [id]
  );
  return res.rows[0];
}

// =====================================================================
// Statistiques globales (tableau de bord admin).
// =====================================================================

export interface AdminStats {
  activeGroups: number;
  contributionsThisMonth: number;
  weeklySeries: Array<{ label: string; amount: number }>;
  lateRate: number; // 0..1 : part des cotisations en retard
}

export async function globalStats(): Promise<AdminStats> {
  const [active, month, weekly, late] = await Promise.all([
    pool.query(`SELECT COUNT(*)::int AS n FROM tontines WHERE status = 'active'`),
    pool.query(
      `SELECT COALESCE(SUM(amount), 0)::float AS total
       FROM payments WHERE created_at >= date_trunc('month', NOW())`
    ),
    // Série des 7 derniers jours (un jour sans cotisation vaut 0).
    pool.query(
      `SELECT to_char(d::date, 'YYYY-MM-DD') AS day,
              COALESCE(SUM(p.amount), 0)::float AS amount
       FROM generate_series(
              date_trunc('day', NOW()) - INTERVAL '6 days',
              date_trunc('day', NOW()),
              INTERVAL '1 day'
            ) d
       LEFT JOIN payments p ON date_trunc('day', p.created_at) = d
       GROUP BY d
       ORDER BY d`
    ),
    pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'late')::float AS late,
         COUNT(*)::float AS total
       FROM payments`
    ),
  ]);

  const lateRow = late.rows[0];
  const lateRate = lateRow.total > 0 ? lateRow.late / lateRow.total : 0;

  return {
    activeGroups: active.rows[0]?.n ?? 0,
    contributionsThisMonth: month.rows[0]?.total ?? 0,
    weeklySeries: weekly.rows.map((r) => ({ label: r.day as string, amount: Number(r.amount) })),
    lateRate,
  };
}

// =====================================================================
// Alertes actives (tableau de bord admin).
// =====================================================================

export interface LatePaymentAlert {
  payment_id: string;
  user_id: string;
  full_name: string | null;
  tontine_id: string;
  tontine_name: string | null;
  days_late: number;
  amount: string;
}

// Membres avec cotisations en retard (statut 'late').
export async function latePaymentAlerts(limit = 50): Promise<LatePaymentAlert[]> {
  const res = await pool.query(
    `SELECT p.id AS payment_id, p.user_id, u.full_name,
            p.tontine_id, t.name AS tontine_name, p.days_late, p.amount
     FROM payments p
     LEFT JOIN users u ON u.id = p.user_id
     LEFT JOIN tontines t ON t.id = p.tontine_id
     WHERE p.status = 'late'
     ORDER BY p.days_late DESC
     LIMIT $1`,
    [limit]
  );
  return res.rows;
}
