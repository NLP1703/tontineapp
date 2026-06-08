import type { Request, Response } from 'express';
import { z } from 'zod';

import * as Admin from '../models/admin.js';
import * as Tontines from '../models/tontine.js';
import * as Members from '../models/member.js';
import * as Rubrics from '../models/rubric.js';
import * as Payments from '../models/payment.js';
import * as Audit from '../models/auditLog.js';
import { emitToMany } from '../notify.js';
import { getNextBeneficiary, type RotationMember } from '../algorithms/rotation.js';

function adminId(req: Request): string {
  return (req as any).userId as string;
}

function toRotationMembers(
  members: Awaited<ReturnType<typeof Members.listByTontine>>
): RotationMember[] {
  return members.map((m) => ({
    userId: m.user_id,
    rotationOrder: m.rotation_order,
    receivedAt: m.received_at,
    reliabilityScore: Number(m.reliability_score),
    payoutDate: m.payout_date,
  }));
}

// GET /api/admin/groups — tous les groupes de la plateforme
export async function listGroups(_req: Request, res: Response) {
  const groups = await Admin.listAllGroups();
  return res.json({ groups });
}

// GET /api/admin/groups/:id — détail complet (membres, cotisations, historique)
export async function groupDetails(req: Request, res: Response) {
  const tontine = await Tontines.findById(req.params.id);
  if (!tontine) return res.status(404).json({ error: 'Group not found' });

  const [members, rubrics, history, totals] = await Promise.all([
    Members.listByTontine(tontine.id),
    Rubrics.listByTontine(tontine.id),
    Payments.listByTontine(tontine.id),
    Payments.totalsForTontine(tontine.id, tontine.current_cycle),
  ]);

  return res.json({ group: tontine, members, rubrics, history, totals });
}

// POST /api/admin/groups/:id/force-rotation — forcer le changement de bénéficiaire
export async function forceRotation(req: Request, res: Response) {
  const tontine = await Tontines.findById(req.params.id);
  if (!tontine) return res.status(404).json({ error: 'Group not found' });

  const members = toRotationMembers(await Members.listByTontine(tontine.id));
  const next = getNextBeneficiary(members);
  if (!next) {
    return res.status(400).json({ error: 'Aucun bénéficiaire en attente : le cycle est complet' });
  }

  // Marque le bénéficiaire comme ayant reçu la cagnotte.
  await Admin.markReceived(tontine.id, next.userId);

  // Si c'était le dernier en attente, on clôt le cycle (nouveau tour).
  const stillPending = members.filter((m) => m.receivedAt === null && m.userId !== next.userId);
  let cycleAdvanced = false;
  if (stillPending.length === 0) {
    await Admin.advanceCycle(tontine.id);
    cycleAdvanced = true;
  }

  // Notifie tous les membres du groupe.
  const memberIds = await Members.listUserIds(tontine.id);
  await emitToMany(memberIds, {
    title: `Rotation — ${tontine.name}`,
    body: cycleAdvanced
      ? `Le cycle est terminé, un nouveau tour commence pour « ${tontine.name} ».`
      : `Le bénéficiaire de la cagnotte a été changé manuellement pour « ${tontine.name} ».`,
    type: 'group',
  });

  await Audit.createLog(adminId(req), 'group.force-rotation', 'group', tontine.id, {
    beneficiary: next.userId,
    cycleAdvanced,
  });

  return res.json({ ok: true, beneficiary: next.userId, cycleAdvanced });
}

// DELETE /api/admin/groups/:id — dissoudre un groupe (avec notification)
export async function dissolveGroup(req: Request, res: Response) {
  const tontine = await Tontines.findById(req.params.id);
  if (!tontine) return res.status(404).json({ error: 'Group not found' });

  // Récupère les membres AVANT suppression pour pouvoir les notifier.
  const memberIds = await Members.listUserIds(tontine.id);

  const removed = await Admin.dissolveGroup(tontine.id);
  if (!removed) return res.status(404).json({ error: 'Group not found' });

  await emitToMany(memberIds, {
    title: `Groupe dissous — ${tontine.name}`,
    body: `Le groupe de tontine « ${tontine.name} » a été dissous par un administrateur.`,
    type: 'alert',
  });

  await Audit.createLog(adminId(req), 'group.dissolve', 'group', tontine.id, {
    name: tontine.name,
    memberCount: memberIds.length,
  });

  return res.json({ ok: true });
}

// GET /api/admin/transactions — toutes les transactions avec filtres
const txQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  status: z.enum(['pending', 'paid', 'late']).optional(),
  tontineId: z.string().uuid().optional(),
});

export async function listTransactions(req: Request, res: Response) {
  const parsed = txQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { page, pageSize, from, to, status, tontineId } = parsed.data;
  const { transactions, total } = await Admin.listAllTransactions(page, pageSize, {
    from,
    to,
    status,
    tontineId,
  });
  return res.json({ transactions, total, page, pageSize });
}

// PATCH /api/admin/transactions/:id/validate — valider manuellement une cotisation
export async function validateTransaction(req: Request, res: Response) {
  const updated = await Admin.validateTransaction(req.params.id);
  if (!updated) return res.status(404).json({ error: 'Transaction not found' });

  await Audit.createLog(adminId(req), 'transaction.validate', 'transaction', req.params.id, {});
  return res.json({ transaction: updated });
}

// GET /api/admin/stats — statistiques globales du tableau de bord admin
export async function stats(_req: Request, res: Response) {
  const stats = await Admin.globalStats();
  return res.json(stats);
}

// GET /api/admin/alerts — alertes actives (retards + groupes en litige)
export async function alerts(_req: Request, res: Response) {
  const latePayments = await Admin.latePaymentAlerts();

  // « Groupes en litige » : dérivés des cotisations en retard (pas de statut de
  // litige dédié dans le schéma) — groupes ayant au moins une cotisation 'late'.
  const disputedMap = new Map<string, { tontine_id: string; tontine_name: string | null; count: number }>();
  for (const p of latePayments) {
    const cur = disputedMap.get(p.tontine_id);
    if (cur) cur.count += 1;
    else disputedMap.set(p.tontine_id, { tontine_id: p.tontine_id, tontine_name: p.tontine_name, count: 1 });
  }

  return res.json({ latePayments, disputedGroups: [...disputedMap.values()] });
}
