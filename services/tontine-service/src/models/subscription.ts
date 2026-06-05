import { pool } from '../db.js';
import { DEFAULT_PLAN, type PlanId } from '../config/plans.js';

export interface Subscription {
  id: string;
  user_id: string;
  plan: PlanId;
  status: string;
  started_at: string;
  expires_at: string | null;
  updated_at: string;
}

// Abonnement d'un utilisateur, ou undefined s'il n'en a pas encore.
export async function findByUser(userId: string): Promise<Subscription | undefined> {
  const res = await pool.query('SELECT * FROM subscriptions WHERE user_id = $1', [userId]);
  return res.rows[0];
}

// Plan effectif d'un utilisateur : son plan s'il a un abonnement, sinon 'free'.
export async function getPlanId(userId: string): Promise<PlanId> {
  const sub = await findByUser(userId);
  return sub?.plan ?? DEFAULT_PLAN;
}

// Crée ou met à jour le plan d'un utilisateur (upsert sur user_id unique).
export async function setPlan(userId: string, plan: PlanId): Promise<Subscription> {
  const res = await pool.query(
    `INSERT INTO subscriptions (user_id, plan, status, updated_at)
     VALUES ($1, $2, 'active', NOW())
     ON CONFLICT (user_id)
     DO UPDATE SET plan = EXCLUDED.plan, status = 'active', updated_at = NOW()
     RETURNING *`,
    [userId, plan]
  );
  return res.rows[0];
}
