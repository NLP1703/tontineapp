import { pool } from '../db.js';

// Le tontine-service partage la base de données avec l'auth-service ;
// il peut donc résoudre un identifiant (email ou téléphone) vers un utilisateur.

export interface BasicUser {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
}

export async function findByEmailOrPhone(identifier: string): Promise<BasicUser | undefined> {
  const res = await pool.query(
    `SELECT id, full_name, email, phone
     FROM users
     WHERE email = $1 OR phone = $1
     LIMIT 1`,
    [identifier]
  );
  return res.rows[0];
}

// Détails (nom, téléphone) de plusieurs utilisateurs en une requête.
export async function findManyByIds(ids: string[]): Promise<BasicUser[]> {
  if (ids.length === 0) return [];
  const res = await pool.query(
    `SELECT id, full_name, email, phone FROM users WHERE id = ANY($1::uuid[])`,
    [ids]
  );
  return res.rows;
}
