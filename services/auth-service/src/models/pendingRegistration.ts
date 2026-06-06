import { pool } from '../db.js';

// Une inscription en attente de vérification OTP. L'utilisateur n'existe PAS
// encore dans `users` : il n'y est créé qu'après validation du code (verifyOtp).
export interface PendingRegistration {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  password_hash: string;
  otp_code: string;
  expires_at: string;
}

// Crée (ou remplace) l'inscription en attente pour cet email : re-tenter une
// inscription régénère le code et repousse l'expiration.
export async function upsert(
  fullName: string,
  email: string,
  passwordHash: string,
  phone: string | null,
  otpCode: string,
  ttlMinutes: number
): Promise<void> {
  await pool.query(
    `INSERT INTO pending_registrations
       (full_name, email, phone, password_hash, otp_code, expires_at)
     VALUES ($1, $2, $3, $4, $5, NOW() + ($6 || ' minutes')::interval)
     ON CONFLICT (email) DO UPDATE SET
       full_name     = EXCLUDED.full_name,
       phone         = EXCLUDED.phone,
       password_hash = EXCLUDED.password_hash,
       otp_code      = EXCLUDED.otp_code,
       expires_at    = EXCLUDED.expires_at,
       created_at    = NOW()`,
    [fullName, email, phone, passwordHash, otpCode, ttlMinutes]
  );
}

// Récupère l'inscription en attente correspondant à l'email ET au code fourni.
export async function findByEmailAndCode(
  email: string,
  code: string
): Promise<PendingRegistration | undefined> {
  const res = await pool.query<PendingRegistration>(
    `SELECT id, full_name, email, phone, password_hash, otp_code, expires_at
     FROM pending_registrations
     WHERE email = $1 AND otp_code = $2`,
    [email, code]
  );
  return res.rows[0];
}

export async function deleteByEmail(email: string): Promise<void> {
  await pool.query('DELETE FROM pending_registrations WHERE email = $1', [email]);
}

// Un téléphone déjà réservé par une AUTRE inscription en attente
// (exceptEmail = l'email en cours, pour autoriser une nouvelle tentative du même inscrit).
export async function existsByPhone(phone: string, exceptEmail?: string): Promise<boolean> {
  const res = await pool.query(
    `SELECT 1 FROM pending_registrations
     WHERE phone = $1 AND ($2::text IS NULL OR email <> $2) LIMIT 1`,
    [phone, exceptEmail ?? null]
  );
  return res.rows.length > 0;
}
