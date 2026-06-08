import { pool } from '../db.js';

// Journal d'audit (cf. migration 009). Table partagée avec le tontine-service :
// chaque action d'administration y est tracée (qui, quoi, sur quelle cible).

export interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
  // Renseigné par les requêtes de listing (joint depuis users).
  admin_name?: string;
  admin_email?: string;
}

// Enregistre une action admin. Ne jette jamais : un échec d'audit ne doit pas
// faire échouer l'action métier déjà réalisée (best effort, on logue l'erreur).
export async function createLog(
  adminId: string,
  action: string,
  targetType: string,
  targetId: string | null,
  details: Record<string, unknown> = {}
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO audit_logs (admin_id, action, target_type, target_id, details)
       VALUES ($1, $2, $3, $4, $5::jsonb)`,
      [adminId, action, targetType, targetId, JSON.stringify(details)]
    );
  } catch (err) {
    console.error('[audit] log failed:', (err as Error).message);
  }
}

export interface ListLogsResult {
  logs: AuditLog[];
  total: number;
}

// Liste paginée des logs avec filtres optionnels (action, admin, plage de dates).
export async function listLogs(
  page: number,
  pageSize: number,
  filters: { action?: string; adminId?: string; from?: string; to?: string } = {}
): Promise<ListLogsResult> {
  const offset = (page - 1) * pageSize;
  const conds: string[] = [];
  const params: unknown[] = [];

  if (filters.action) {
    params.push(filters.action);
    conds.push(`a.action = $${params.length}`);
  }
  if (filters.adminId) {
    params.push(filters.adminId);
    conds.push(`a.admin_id = $${params.length}`);
  }
  if (filters.from) {
    params.push(filters.from);
    conds.push(`a.created_at >= $${params.length}`);
  }
  if (filters.to) {
    params.push(filters.to);
    conds.push(`a.created_at <= $${params.length}`);
  }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

  const [rows, count] = await Promise.all([
    pool.query(
      `SELECT a.*, u.full_name AS admin_name, u.email AS admin_email
       FROM audit_logs a
       JOIN users u ON u.id = a.admin_id
       ${where}
       ORDER BY a.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, pageSize, offset]
    ),
    pool.query(`SELECT COUNT(*)::int AS n FROM audit_logs a ${where}`, params),
  ]);

  return { logs: rows.rows, total: count.rows[0]?.n ?? 0 };
}
