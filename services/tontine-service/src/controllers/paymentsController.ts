import type { Request, Response } from 'express';
import { z } from 'zod';

import * as Tontines from '../models/tontine.js';
import * as Members from '../models/member.js';
import * as Payments from '../models/payment.js';
import * as Rubrics from '../models/rubric.js';
import * as Users from '../models/user.js';
import { emitToMany } from '../notify.js';
import { contributionsTotal } from '../metrics.js';
import { calculateReliabilityScore } from '../algorithms/reliability.js';
import {
  getNextBeneficiary,
  recommendRotationOrder,
  type RotationMember,
} from '../algorithms/rotation.js';

function userId(req: Request): string {
  return (req as any).userId as string;
}

function toRotationMembers(members: Awaited<ReturnType<typeof Members.listByTontine>>): RotationMember[] {
  return members.map((m) => ({
    userId: m.user_id,
    rotationOrder: m.rotation_order,
    receivedAt: m.received_at,
    reliabilityScore: Number(m.reliability_score),
    payoutDate: m.payout_date,
  }));
}

const contributeSchema = z.object({
  // Montant requis pour une cotisation sur une seule rubrique ; ignoré quand payAll = true.
  amount: z.number().positive().optional(),
  daysLate: z.number().int().min(0).default(0),
  // Numéro mobile money qui effectue le dépôt.
  senderPhone: z.string().min(6).max(20),
  // Numéro mobile money qui reçoit le dépôt (collecteur / bénéficiaire).
  receiverPhone: z.string().min(6).max(20),
  // Rubrique concernée (SECOURS, COLLATION, ÉPARGNE…), optionnelle si le groupe n'en a pas.
  rubric: z.string().min(1).max(50).optional(),
  // true => cotiser pour toutes les rubriques du groupe en une seule fois.
  payAll: z.boolean().optional().default(false),
});

// POST /api/groups/:id/contribute — enregistrer une (ou plusieurs) cotisation(s)
export async function contribute(req: Request, res: Response) {
  const parsed = contributeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const tontine = await Tontines.findById(req.params.id);
  if (!tontine) return res.status(404).json({ error: 'Group not found' });

  const uid = userId(req);
  if (!(await Members.isMember(tontine.id, uid))) {
    return res.status(403).json({ error: 'Not a member of this group' });
  }

  const { amount, daysLate, senderPhone, receiverPhone, rubric, payAll } = parsed.data;
  const rubrics = await Rubrics.listByTontine(tontine.id);

  // Détermine les cotisations à enregistrer : une par rubrique (payAll) ou une seule.
  const items: Array<{ amount: number; rubric: string | null }> = [];
  if (payAll && rubrics.length > 0) {
    for (const r of rubrics) items.push({ amount: Number(r.amount), rubric: r.name });
  } else {
    const single =
      amount ?? (payAll ? Number(tontine.contribution_amount) : undefined);
    if (!single || single <= 0) {
      return res.status(400).json({ error: 'Montant requis' });
    }
    items.push({ amount: single, rubric: rubric ?? null });
  }

  const payments = [];
  for (const it of items) {
    payments.push(
      await Payments.create({
        userId: uid,
        tontineId: tontine.id,
        cycle: tontine.current_cycle,
        amount: it.amount,
        daysLate,
        rubric: it.rubric,
        senderPhone,
        receiverPhone,
      })
    );
  }
  contributionsTotal.inc(payments.length);

  const totalAmount = payments.reduce((acc, p) => acc + Number(p.amount), 0);

  // Recalcule le score de fiabilité du membre après la cotisation (Innovation).
  const history = await Payments.historyForMember(tontine.id, uid);
  const score = calculateReliabilityScore(history);
  await Members.updateReliability(tontine.id, uid, score);

  // Notifie TOUS les membres du groupe de la cotisation.
  const [payer, memberIds] = await Promise.all([
    Users.findManyByIds([uid]),
    Members.listUserIds(tontine.id),
  ]);
  const payerName = payer[0]?.full_name ?? 'Un membre';
  const label =
    payAll && rubrics.length > 0
      ? ' (toutes rubriques)'
      : rubric
        ? ` (${rubric})`
        : '';
  await emitToMany(memberIds, {
    title: `Nouvelle cotisation — ${tontine.name}`,
    body: `${payerName} a cotisé ${totalAmount.toLocaleString()} CFA${label}.`,
    type: 'payment',
  });

  return res.status(201).json({ payments, reliabilityScore: score });
}

// GET /api/groups/:id/rotation — ordre de rotation + prochain bénéficiaire
export async function rotation(req: Request, res: Response) {
  const tontine = await Tontines.findById(req.params.id);
  if (!tontine) return res.status(404).json({ error: 'Group not found' });

  const members = toRotationMembers(await Members.listByTontine(tontine.id));
  return res.json({
    currentOrder: members,
    recommendedOrder: recommendRotationOrder(members),
    nextBeneficiary: getNextBeneficiary(members) ?? null,
  });
}

// GET /api/groups/:id/history — historique des transactions
export async function history(req: Request, res: Response) {
  const tontine = await Tontines.findById(req.params.id);
  if (!tontine) return res.status(404).json({ error: 'Group not found' });

  const payments = await Payments.listByTontine(tontine.id);
  return res.json({ payments });
}
