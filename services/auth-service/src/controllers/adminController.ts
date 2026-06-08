import type { Request, Response } from 'express';
import { z } from 'zod';

import * as Users from '../models/user.js';
import * as Audit from '../models/auditLog.js';

function adminId(req: Request): string {
  return (req as any).userId as string;
}

// GET /api/auth/users — liste paginée + recherche (super_admin)
const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(120).optional(),
});

export async function listUsers(req: Request, res: Response) {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { page, pageSize, search } = parsed.data;
  const { users, total } = await Users.listUsers(page, pageSize, search);
  return res.json({ users, total, page, pageSize });
}

// PATCH /api/auth/users/:id/role — change le rôle d'un utilisateur (super_admin)
const setRoleSchema = z.object({
  role: z.enum(['member', 'group_admin', 'super_admin']),
});

export async function setRole(req: Request, res: Response) {
  const parsed = setRoleSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const targetId = req.params.id;
  const me = adminId(req);

  // Garde-fou : un super_admin ne peut pas se rétrograder lui-même (évite de
  // verrouiller la plateforme hors de tout accès admin par accident).
  if (targetId === me && parsed.data.role !== 'super_admin') {
    return res.status(400).json({ error: 'Vous ne pouvez pas changer votre propre rôle de super_admin' });
  }

  const updated = await Users.setRole(targetId, parsed.data.role);
  if (!updated) return res.status(404).json({ error: 'User not found' });

  await Audit.createLog(me, 'user.role.update', 'user', targetId, { role: parsed.data.role });
  return res.json({ user: updated });
}

// DELETE /api/auth/users/:id — désactivation (soft delete) d'un compte (super_admin)
export async function softDeleteUser(req: Request, res: Response) {
  const targetId = req.params.id;
  const me = adminId(req);

  if (targetId === me) {
    return res.status(400).json({ error: 'Vous ne pouvez pas désactiver votre propre compte' });
  }

  const updated = await Users.softDelete(targetId);
  if (!updated) return res.status(404).json({ error: 'User not found' });

  await Audit.createLog(me, 'user.disable', 'user', targetId, {});
  return res.json({ user: updated });
}

// GET /api/auth/admin/audit — journal d'audit paginé + filtres (super_admin)
const auditQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  action: z.string().trim().max(80).optional(),
  adminId: z.string().uuid().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export async function listAudit(req: Request, res: Response) {
  const parsed = auditQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { page, pageSize, action, adminId: filterAdmin, from, to } = parsed.data;
  const { logs, total } = await Audit.listLogs(page, pageSize, {
    action,
    adminId: filterAdmin,
    from,
    to,
  });
  return res.json({ logs, total, page, pageSize });
}

// GET /api/auth/admin/stats — statistiques utilisateurs (super_admin)
export async function userStats(_req: Request, res: Response) {
  const totalUsers = await Users.countAll();
  return res.json({ totalUsers });
}
