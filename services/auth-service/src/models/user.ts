import { pool } from '../db.js';

export interface User {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  password_hash?: string;
  email_verified?: boolean;
}

export async function findByEmail(email: string): Promise<User | undefined> {
  const res = await pool.query(
    'SELECT id, full_name, email, phone, password_hash, email_verified FROM users WHERE email = $1',
    [email]
  );
  return res.rows[0];
}

// Marque l'email comme vérifié (après validation de l'OTP d'inscription).
export async function markEmailVerified(userId: string): Promise<void> {
  await pool.query('UPDATE users SET email_verified = true WHERE id = $1', [userId]);
}

// Met à jour le mot de passe (après validation de l'OTP de réinitialisation).
export async function updatePassword(userId: string, passwordHash: string): Promise<void> {
  await pool.query('UPDATE users SET password_hash = $2 WHERE id = $1', [userId, passwordHash]);
}

export async function findById(id: string): Promise<User | undefined> {
  const res = await pool.query(
    'SELECT id, full_name, email, phone FROM users WHERE id = $1',
    [id]
  );
  return res.rows[0];
}

export async function existsByEmail(email: string): Promise<boolean> {
  const res = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  return res.rows.length > 0;
}

export async function existsByPhone(phone: string): Promise<boolean> {
  const res = await pool.query('SELECT id FROM users WHERE phone = $1', [phone]);
  return res.rows.length > 0;
}

export async function create(
  fullName: string,
  email: string,
  passwordHash: string,
  phone: string | null = null
): Promise<User> {
  const res = await pool.query(
    `INSERT INTO users (full_name, email, phone, password_hash)
     VALUES ($1, $2, $3, $4)
     RETURNING id, full_name, email, phone`,
    [fullName, email, phone, passwordHash]
  );
  return res.rows[0];
}
