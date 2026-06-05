import type { Request, Response } from 'express';
import { z } from 'zod';

import * as Subscriptions from '../models/subscription.js';
import { PLANS, getPlan, isPlanId } from '../config/plans.js';

function userId(req: Request): string {
  return (req as any).userId as string;
}

// Catalogue public des plans disponibles (pour la page tarifs du frontend).
export function listPlans(_req: Request, res: Response) {
  return res.json({ plans: Object.values(PLANS) });
}

// Abonnement courant de l'utilisateur + détail du plan associé.
export async function current(req: Request, res: Response) {
  const sub = await Subscriptions.findByUser(userId(req));
  const planId = sub?.plan ?? 'free';
  return res.json({
    plan: getPlan(planId),
    subscription: sub ?? null,
  });
}

// Changement de plan. Dans une vraie prod, cet endpoint serait appelé
// APRÈS confirmation d'un paiement (Mobile Money / Stripe) ; ici il applique
// directement le plan choisi pour la démonstration.
const changeSchema = z.object({
  plan: z.string().refine(isPlanId, { message: 'Plan invalide (free | standard | premium)' }),
});

export async function change(req: Request, res: Response) {
  const parsed = changeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const sub = await Subscriptions.setPlan(userId(req), parsed.data.plan as any);
  return res.json({ plan: getPlan(sub.plan), subscription: sub });
}
