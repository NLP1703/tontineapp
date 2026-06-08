import { pool } from '../db.js';

export type UserRole = 'member' | 'group_admin' | 'super_admin';

export interface User {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  password_hash?: string;
  email_verified?: boolean;
  role?: UserRole;
  is_active?: boolean;
}

export async function findByEmail(email: string): Promise<User | undefined> {
  const res = await pool.query(
    'SELECT id, full_name, email, phone, password_hash, email_verified, role, is_active FROM users WHERE email = $1',
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
    'SELECT id, full_name, email, phone, role, is_active FROM users WHERE id = $1',
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
     RETURNING id, full_name, email, phone, role, is_active`,
    [fullName, email, phone, passwordHash]
  );
  return res.rows[0];
}

// =====================================================================
// Module Admin (cf. migration 009) — gestion des rôles & des comptes.
// =====================================================================

// Crée directement un compte avec un rôle donné (utilisé par le seed du
// super_admin). L'email est marqué vérifié car le compte est créé en interne.
export async function createWithRole(
  fullName: string,
  email: string,
  passwordHash: string,
  role: UserRole
): Promise<User> {
  const res = await pool.query(
    `INSERT INTO users (full_name, email, password_hash, role, email_verified)
     VALUES ($1, $2, $3, $4, true)
     RETURNING id, full_name, email, phone, role, is_active`,
    [fullName, email, passwordHash, role]
  );
  return res.rows[0];
}

// Vrai s'il existe au moins un super_admin (le seed n'agit que sinon).
export async function existsSuperAdmin(): Promise<boolean> {
  const res = await pool.query(
    `SELECT 1 FROM users WHERE role = 'super_admin' LIMIT 1`
  );
  return res.rows.length > 0;
}

// Change le rôle d'un utilisateur. Retourne l'utilisateur mis à jour ou undefined.
export async function setRole(id: string, role: UserRole): Promise<User | undefined> {
  const res = await pool.query(
    `UPDATE users SET role = $2 WHERE id = $1
     RETURNING id, full_name, email, phone, role, is_active`,
    [id, role]
  );
  return res.rows[0];
}

// Désactive un compte (soft delete). Retourne l'utilisateur mis à jour ou undefined.
export async function softDelete(id: string): Promise<User | undefined> {
  const res = await pool.query(
    `UPDATE users SET is_active = false WHERE id = $1
     RETURNING id, full_name, email, phone, role, is_active`,
    [id]
  );
  return res.rows[0];
}

export interface ListUsersResult {
  users: User[];
  total: number;
}

// Liste paginée des utilisateurs avec recherche optionnelle (nom OU email).
export async function listUsers(
  page: number,
  pageSize: number,
  search?: string
): Promise<ListUsersResult> {
  const offset = (page - 1) * pageSize;
  const where = search ? `WHERE full_name ILIKE $1 OR email ILIKE $1` : '';
  const searchParam = search ? [`%${search}%`] : [];

  const [rows, count] = await Promise.all([
    pool.query(
      `SELECT id, full_name, email, phone, role, is_active, created_at
       FROM users ${where}
       ORDER BY created_at DESC
       LIMIT $${searchParam.length + 1} OFFSET $${searchParam.length + 2}`,
      [...searchParam, pageSize, offset]
    ),
    pool.query(`SELECT COUNT(*)::int AS n FROM users ${where}`, searchParam),
  ]);

  return { users: rows.rows, total: count.rows[0]?.n ?? 0 };
}

// Compteur total d'utilisateurs (statistiques admin).
export async function countAll(): Promise<number> {
  const res = await pool.query(`SELECT COUNT(*)::int AS n FROM users`);
  return res.rows[0]?.n ?? 0;
}
