import { pool } from '../db.js';

export type OtpPurpose = 'signup' | 'password_reset';

export interface Otp {
  id: string;
  code: string;
  expires_at: string;
}

export async function create(
  userId: string,
  code: string,
  ttlMinutes: number,
  purpose: OtpPurpose = 'signup'
): Promise<void> {
  await pool.query(
    `INSERT INTO otps (user_id, code, expires_at, purpose)
     VALUES ($1, $2, NOW() + ($3 || ' minutes')::interval, $4)`,
    [userId, code, ttlMinutes, purpose]
  );
}

// Cherche le dernier OTP valide pour un utilisateur (toutes finalités confondues :
// inscription ou réinitialisation), non utilisé et correspondant au code.
export async function findLatest(userId: string, code: string): Promise<Otp | undefined> {
  const res = await pool.query(
    `SELECT id, code, expires_at
     FROM otps
     WHERE user_id = $1 AND code = $2 AND used_at IS NULL
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId, code]
  );
  return res.rows[0];
}

export async function markUsed(id: string): Promise<void> {
  await pool.query('UPDATE otps SET used_at = NOW() WHERE id = $1', [id]);
}
