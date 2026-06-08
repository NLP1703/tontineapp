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
 *   - name: Admin - Groups
 *     description: Administration des groupes et transactions (rôle super_admin requis)
 */

/**
 * @swagger
 * /api/admin/groups:
 *   get:
 *     summary: Liste tous les groupes de la plateforme
 *     description: Réservé au rôle **super_admin**. Inclut propriétaire, nombre de membres et cagnotte collectée.
 *     tags: [Admin - Groups]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "{ groups }" }
 *       401: { description: Token manquant ou invalide }
 *       403: { description: Rôle super_admin requis }
 */
router.get('/groups', ctrl.listGroups);

/**
 * @swagger
 * /api/admin/groups/{id}:
 *   get:
 *     summary: Détail complet d'un groupe (membres, cotisations, historique)
 *     description: Réservé au rôle **super_admin**.
 *     tags: [Admin - Groups]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: "{ group, members, rubrics, history, totals }" }
 *       401: { description: Token manquant ou invalide }
 *       403: { description: Rôle super_admin requis }
 *       404: { description: Groupe introuvable }
 *   delete:
 *     summary: Dissoudre un groupe (notifie les membres)
 *     description: Réservé au rôle **super_admin**. Supprime le groupe et ses données liées (cascade). Action tracée dans le journal d'audit.
 *     tags: [Admin - Groups]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: "{ ok: true }" }
 *       401: { description: Token manquant ou invalide }
 *       403: { description: Rôle super_admin requis }
 *       404: { description: Groupe introuvable }
 */
router.get('/groups/:id', ctrl.groupDetails);
router.delete('/groups/:id', ctrl.dissolveGroup);

/**
 * @swagger
 * /api/admin/groups/{id}/force-rotation:
 *   post:
 *     summary: Forcer manuellement le changement de bénéficiaire
 *     description: Réservé au rôle **super_admin**. Marque le prochain bénéficiaire comme ayant reçu la cagnotte ; clôt le cycle si c'était le dernier. Action tracée dans le journal d'audit.
 *     tags: [Admin - Groups]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: "{ ok, beneficiary, cycleAdvanced }" }
 *       400: { description: Cycle déjà complet }
 *       401: { description: Token manquant ou invalide }
 *       403: { description: Rôle super_admin requis }
 *       404: { description: Groupe introuvable }
 */
router.post('/groups/:id/force-rotation', ctrl.forceRotation);

/**
 * @swagger
 * /api/admin/transactions:
 *   get:
 *     summary: Toutes les transactions (filtres date, statut, groupe)
 *     description: Réservé au rôle **super_admin**.
 *     tags: [Admin - Groups]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, paid, late] }
 *       - in: query
 *         name: tontineId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200: { description: "{ transactions, total, page, pageSize }" }
 *       400: { description: Paramètres invalides }
 *       401: { description: Token manquant ou invalide }
 *       403: { description: Rôle super_admin requis }
 */
router.get('/transactions', ctrl.listTransactions);

/**
 * @swagger
 * /api/admin/transactions/{id}/validate:
 *   patch:
 *     summary: Valider manuellement une cotisation contestée
 *     description: Réservé au rôle **super_admin**. Passe la cotisation au statut 'paid'. Action tracée dans le journal d'audit.
 *     tags: [Admin - Groups]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: "{ transaction }" }
 *       401: { description: Token manquant ou invalide }
 *       403: { description: Rôle super_admin requis }
 *       404: { description: Transaction introuvable }
 */
router.patch('/transactions/:id/validate', ctrl.validateTransaction);

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Statistiques globales (groupes actifs, cotisations, retards)
 *     description: Réservé au rôle **super_admin**.
 *     tags: [Admin - Groups]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "{ activeGroups, contributionsThisMonth, weeklySeries, lateRate }" }
 *       401: { description: Token manquant ou invalide }
 *       403: { description: Rôle super_admin requis }
 */
router.get('/stats', ctrl.stats);

/**
 * @swagger
 * /api/admin/alerts:
 *   get:
 *     summary: Alertes actives (retards de paiement, groupes en litige)
 *     description: Réservé au rôle **super_admin**.
 *     tags: [Admin - Groups]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "{ latePayments, disputedGroups }" }
 *       401: { description: Token manquant ou invalide }
 *       403: { description: Rôle super_admin requis }
 */
router.get('/alerts', ctrl.alerts);

export default router;
