import { pool } from '../db.js';

export interface Rubric {
  id: string;
  tontine_id: string;
  name: string;
  amount: string;
}

export async function listByTontine(tontineId: string): Promise<Rubric[]> {
  const res = await pool.query(
    `SELECT id, tontine_id, name, amount FROM tontine_rubrics
     WHERE tontine_id = $1 ORDER BY name ASC`,
    [tontineId]
  );
  return res.rows;
}

// Insère les rubriques d'une tontine (ignore les doublons de nom).
export async function addMany(
  tontineId: string,
  rubrics: Array<{ name: string; amount: number }>
): Promise<void> {
  for (const r of rubrics) {
    await pool.query(
      `INSERT INTO tontine_rubrics (tontine_id, name, amount)
       VALUES ($1, $2, $3)
       ON CONFLICT (tontine_id, name) DO UPDATE SET amount = EXCLUDED.amount`,
      [tontineId, r.name, r.amount]
    );
  }
}

export async function exists(tontineId: string, name: string): Promise<boolean> {
  const res = await pool.query(
    `SELECT 1 FROM tontine_rubrics WHERE tontine_id = $1 AND name = $2`,
    [tontineId, name]
  );
  return res.rows.length > 0;
}
