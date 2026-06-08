import { pool } from '../db.js';

// Journal d'audit (cf. migration 009). Table partagée avec l'auth-service.
// Côté tontine-service on n'écrit que des logs ; la lecture/listing est exposée
// par l'auth-service. Copie réduite de auth-service/src/models/auditLog.ts.

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
