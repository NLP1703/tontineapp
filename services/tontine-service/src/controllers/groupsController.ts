import type { Request, Response } from 'express';
import { z } from 'zod';

import * as Tontines from '../models/tontine.js';
import * as Members from '../models/member.js';
import * as Rubrics from '../models/rubric.js';
import * as Payments from '../models/payment.js';
import * as Users from '../models/user.js';
import { emitNotification, emitToMany } from '../notify.js';
import { computeNextDeadline } from '../algorithms/schedule.js';

function userId(req: Request): string {
  return (req as any).userId as string;
}

export async function list(req: Request, res: Response) {
  const groups = await Tontines.listForUser(userId(req));
  return res.json({ groups });
}

// Rubriques autorisées à la création d'un groupe.
const RUBRIC_NAMES = ['SECOURS', 'COLLATION', 'EPARGNE'] as const;

const createSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional(),
  contributionAmount: z.number().nonnegative().default(0),
  frequency: z.enum(['monthly', 'weekly', 'biweekly']).default('monthly'),
  // Jour récurrent de cotisation : 1..28 (jour du mois) ou 1..7 (jour de semaine).
  paymentDay: z.number().int().min(1).max(31).nullable().optional(),
  rubrics: z
    .array(
      z.object({
        name: z.enum(RUBRIC_NAMES),
        amount: z.number().nonnegative().default(0),
      })
    )
    .max(RUBRIC_NAMES.length)
    .optional()
    .default([]),
});

export async function create(req: Request, res: Response) {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { name, description, contributionAmount, frequency, rubrics, paymentDay } = parsed.data;
  const owner = userId(req);

  let tontine = await Tontines.create(
    owner,
    name,
    description ?? null,
    contributionAmount,
    frequency,
    paymentDay ?? null
  );

  // Le jour de paiement récurrent génère automatiquement la date limite du cycle.
  if (paymentDay) {
    const deadline = computeNextDeadline(paymentDay, frequency);
    tontine = (await Tontines.setDeadline(tontine.id, deadline.toISOString())) ?? tontine;
  }

  // Rubriques choisies à la création (SECOURS, COLLATION, ÉPARGNE…).
  if (rubrics.length > 0) {
    await Rubrics.addMany(tontine.id, rubrics);
  }

  // Le créateur devient automatiquement le premier membre.
  await Members.add(tontine.id, owner);

  // Notifie le créateur que son groupe est prêt.
  await emitNotification({
    userId: owner,
    title: `Groupe créé — ${tontine.name}`,
    body: `Votre groupe de tontine « ${tontine.name} » a bien été créé. Vous pouvez maintenant y ajouter des membres.`,
    type: 'group',
  });

  return res.status(201).json({ group: tontine, rubrics });
}

export async function details(req: Request, res: Response) {
  const tontine = await Tontines.findById(req.params.id);
  if (!tontine) return res.status(404).json({ error: 'Group not found' });

  const [members, rubrics, paidIds] = await Promise.all([
    Members.listByTontine(tontine.id),
    Rubrics.listByTontine(tontine.id),
    Payments.paidUserIdsForCycle(tontine.id, tontine.current_cycle),
  ]);
  // Marque chaque membre comme ayant cotisé (ou non) pour le cycle courant.
  const paid = new Set(paidIds);
  const membersWithStatus = members.map((m) => ({ ...m, has_paid: paid.has(m.user_id) }));
  return res.json({ group: tontine, members: membersWithStatus, rubrics });
}

// Ajout d'un membre par email OU numéro de téléphone (réservé au créateur).
const addMemberSchema = z.object({ identifier: z.string().min(3).max(120) });

export async function addMember(req: Request, res: Response) {
  const parsed = addMemberSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const tontine = await Tontines.findById(req.params.id);
  if (!tontine) return res.status(404).json({ error: 'Group not found' });
  if (tontine.owner_user_id !== userId(req)) {
    return res.status(403).json({ error: 'Only the owner can add members' });
  }

  const user = await Users.findByEmailOrPhone(parsed.data.identifier.trim());
  if (!user) return res.status(404).json({ error: 'Aucun utilisateur avec cet email ou téléphone' });

  if (await Members.isMember(tontine.id, user.id)) {
    return res.status(409).json({ error: 'Cette personne est déjà membre du groupe' });
  }

  const member = await Members.add(tontine.id, user.id);

  // Notifications : le nouveau membre personnellement + les membres déjà présents.
  await emitNotification({
    userId: user.id,
    title: `Vous avez rejoint ${tontine.name}`,
    body: `Vous avez été ajouté au groupe de tontine « ${tontine.name} ».`,
    type: 'group',
  });
  const existingIds = (await Members.listUserIds(tontine.id)).filter((id) => id !== user.id);
  await emitToMany(existingIds, {
    title: `Nouveau membre — ${tontine.name}`,
    body: `${user.full_name} a rejoint le groupe.`,
    type: 'group',
  });

  return res.status(201).json({ member: { ...member, full_name: user.full_name, phone: user.phone } });
}

// Retrait d'un membre (réservé au créateur ; il ne peut pas se retirer lui-même).
export async function removeMember(req: Request, res: Response) {
  const tontine = await Tontines.findById(req.params.id);
  if (!tontine) return res.status(404).json({ error: 'Group not found' });
  if (tontine.owner_user_id !== userId(req)) {
    return res.status(403).json({ error: 'Only the owner can remove members' });
  }

  const targetId = req.params.userId;
  if (targetId === tontine.owner_user_id) {
    return res.status(400).json({ error: 'Le créateur ne peut pas être retiré du groupe' });
  }

  const removed = await Members.remove(tontine.id, targetId);
  if (!removed) return res.status(404).json({ error: 'Membre introuvable dans ce groupe' });

  // Notifications : la personne retirée + les membres restants.
  const [removedUser] = await Users.findManyByIds([targetId]);
  const removedName = removedUser?.full_name ?? 'Un membre';
  await emitNotification({
    userId: targetId,
    title: `Retrait du groupe ${tontine.name}`,
    body: `Vous ne faites plus partie du groupe de tontine « ${tontine.name} ».`,
    type: 'group',
  });
  const remainingIds = await Members.listUserIds(tontine.id);
  await emitToMany(remainingIds, {
    title: `Départ d'un membre — ${tontine.name}`,
    body: `${removedName} a été retiré du groupe.`,
    type: 'group',
  });

  return res.json({ ok: true });
}

// Définition de la date limite de paiement (réservé au créateur).
const deadlineSchema = z.object({
  // ISO 8601 ; null pour effacer l'échéance.
  deadline: z.string().datetime().nullable(),
});

export async function setDeadline(req: Request, res: Response) {
  const parsed = deadlineSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const tontine = await Tontines.findById(req.params.id);
  if (!tontine) return res.status(404).json({ error: 'Group not found' });
  if (tontine.owner_user_id !== userId(req)) {
    return res.status(403).json({ error: 'Only the owner can set the deadline' });
  }

  const updated = await Tontines.setDeadline(tontine.id, parsed.data.deadline);

  // Notifie tous les membres de la nouvelle échéance.
  if (parsed.data.deadline) {
    const memberIds = await Members.listUserIds(tontine.id);
    const when = new Date(parsed.data.deadline).toLocaleString('fr-FR', {
      dateStyle: 'long',
      timeStyle: 'short',
    });
    await emitToMany(memberIds, {
      title: `Date limite — ${tontine.name}`,
      body: `La date limite de cotisation est fixée au ${when}.`,
      type: 'reminder',
    });
  }

  return res.json({ group: updated });
}

// Fixe la « date de bouffe » d'un membre : date à laquelle il reçoit la cagnotte
// (réservé au créateur). Le membre concerné est notifié.
const payoutDateSchema = z.object({
  // YYYY-MM-DD ; null pour effacer.
  payoutDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format attendu : YYYY-MM-DD')
    .nullable(),
});

export async function setMemberPayoutDate(req: Request, res: Response) {
  const parsed = payoutDateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const tontine = await Tontines.findById(req.params.id);
  if (!tontine) return res.status(404).json({ error: 'Group not found' });
  if (tontine.owner_user_id !== userId(req)) {
    return res.status(403).json({ error: 'Only the owner can set payout dates' });
  }

  const targetId = req.params.userId;
  const ok = await Members.setPayoutDate(tontine.id, targetId, parsed.data.payoutDate);
  if (!ok) return res.status(404).json({ error: 'Membre introuvable dans ce groupe' });

  // Notifie le membre concerné de sa date de bouffe.
  if (parsed.data.payoutDate) {
    const when = new Date(parsed.data.payoutDate).toLocaleDateString('fr-FR', {
      dateStyle: 'long',
    });
    await emitNotification({
      userId: targetId,
      title: `Date de réception — ${tontine.name}`,
      body: `Vous recevrez la cagnotte du groupe « ${tontine.name} » le ${when}.`,
      type: 'group',
    });
  }

  return res.json({ ok: true });
}
