import { Router } from 'express';

import * as ctrl from '../controllers/adminController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { rateLimit } from '../middleware/rateLimit.js';

const router = Router();

// Toutes les routes admin : authentification + rôle super_admin (vérifié côté
// serveur depuis le JWT) + rate limiting renforcé (30 req/min).
router.use(requireAuth);
router.use(requireRole(['super_admin']));
router.use(rateLimit({ windowMs: 60_000, max: 30 }));

/**
 * @swagger
 * tags:
 *   - name: Admin - Users
 *     description: Gestion des utilisateurs (rôle super_admin requis)
 */

/**
 * @swagger
 * /api/auth/users:
 *   get:
 *     summary: Liste paginée des utilisateurs (recherche par nom/email)
 *     description: Réservé au rôle **super_admin**.
 *     tags: [Admin - Users]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Filtre sur le nom OU l'email.
 *     responses:
 *       200: { description: "Liste paginée { users, total, page, pageSize }" }
 *       400: { description: Paramètres invalides }
 *       401: { description: Token manquant ou invalide }
 *       403: { description: Rôle super_admin requis }
 */
router.get('/users', ctrl.listUsers);

/**
 * @swagger
 * /api/auth/users/{id}/role:
 *   patch:
 *     summary: Modifier le rôle d'un utilisateur
 *     description: Réservé au rôle **super_admin**. L'action est tracée dans le journal d'audit.
 *     tags: [Admin - Users]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role: { type: string, enum: [member, group_admin, super_admin] }
 *     responses:
 *       200: { description: "Utilisateur mis à jour { user }" }
 *       400: { description: Rôle invalide ou auto-rétrogradation interdite }
 *       401: { description: Token manquant ou invalide }
 *       403: { description: Rôle super_admin requis }
 *       404: { description: Utilisateur introuvable }
 */
router.patch('/users/:id/role', ctrl.setRole);

/**
 * @swagger
 * /api/auth/users/{id}:
 *   delete:
 *     summary: Désactiver (soft delete) un compte utilisateur
 *     description: Réservé au rôle **super_admin**. Le compte ne peut plus se connecter ; ses données sont conservées. Action tracée dans le journal d'audit.
 *     tags: [Admin - Users]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: "Compte désactivé { user }" }
 *       400: { description: Impossible de désactiver son propre compte }
 *       401: { description: Token manquant ou invalide }
 *       403: { description: Rôle super_admin requis }
 *       404: { description: Utilisateur introuvable }
 */
router.delete('/users/:id', ctrl.softDeleteUser);

/**
 * @swagger
 * /api/auth/admin/stats:
 *   get:
 *     summary: Statistiques utilisateurs globales
 *     description: Réservé au rôle **super_admin**.
 *     tags: [Admin - Users]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "{ totalUsers }" }
 *       401: { description: Token manquant ou invalide }
 *       403: { description: Rôle super_admin requis }
 */
router.get('/admin/stats', ctrl.userStats);

/**
 * @swagger
 * /api/auth/admin/audit:
 *   get:
 *     summary: Journal d'audit des actions admin (filtres action/admin/date)
 *     description: Réservé au rôle **super_admin**.
 *     tags: [Admin - Users]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
 *       - in: query
 *         name: action
 *         schema: { type: string }
 *       - in: query
 *         name: adminId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200: { description: "Journal paginé { logs, total, page, pageSize }" }
 *       400: { description: Paramètres invalides }
 *       401: { description: Token manquant ou invalide }
 *       403: { description: Rôle super_admin requis }
 */
router.get('/admin/audit', ctrl.listAudit);

export default router;
