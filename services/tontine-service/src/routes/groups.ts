import { Router } from 'express';

import * as groups from '../controllers/groupsController.js';
import * as payments from '../controllers/paymentsController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

// Toutes les routes de groupe nécessitent une authentification.
router.use(requireAuth);

/**
 * @swagger
 * /api/groups:
 *   get:
 *     summary: Liste des groupes de l'utilisateur
 *     tags: [Groups]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Liste des groupes }
 *   post:
 *     summary: Créer un nouveau groupe de tontine
 *     tags: [Groups]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Groupe créé }
 */
router.get('/', groups.list);
router.post('/', groups.create);

/**
 * @swagger
 * /api/groups/{id}:
 *   get:
 *     summary: Détail d'un groupe + membres
 *     tags: [Groups]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Détail du groupe }
 *       404: { description: Groupe introuvable }
 */
router.get('/:id', groups.details);

/**
 * @swagger
 * /api/groups/{id}/members:
 *   post:
 *     summary: Ajouter un membre (propriétaire uniquement)
 *     tags: [Groups]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Membre ajouté }
 *       403: { description: Réservé au propriétaire }
 */
router.post('/:id/members', groups.addMember);

/**
 * @swagger
 * /api/groups/{id}/members/{userId}:
 *   delete:
 *     summary: Retirer un membre (propriétaire uniquement)
 *     tags: [Groups]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Membre retiré }
 *       400: { description: Le créateur ne peut pas être retiré }
 *       403: { description: Réservé au propriétaire }
 */
router.delete('/:id/members/:userId', groups.removeMember);

/**
 * @swagger
 * /api/groups/{id}/deadline:
 *   patch:
 *     summary: Définir la date limite de paiement (propriétaire uniquement)
 *     tags: [Groups]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Échéance mise à jour, membres notifiés }
 *       403: { description: Réservé au propriétaire }
 */
router.patch('/:id/deadline', groups.setDeadline);

/**
 * @swagger
 * /api/groups/{id}/members/{userId}/payout-date:
 *   patch:
 *     summary: Définir la date de réception de la cagnotte d'un membre (propriétaire uniquement)
 *     tags: [Groups]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Date de bouffe enregistrée, membre notifié }
 *       403: { description: Réservé au propriétaire }
 */
router.patch('/:id/members/:userId/payout-date', groups.setMemberPayoutDate);

/**
 * @swagger
 * /api/groups/{id}/contribute:
 *   post:
 *     summary: Enregistrer une cotisation
 *     tags: [Payments]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Cotisation enregistrée + score recalculé }
 */
router.post('/:id/contribute', payments.contribute);

/**
 * @swagger
 * /api/groups/{id}/rotation:
 *   get:
 *     summary: Ordre de rotation + prochain bénéficiaire
 *     tags: [Payments]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Ordre courant, recommandé et prochain bénéficiaire }
 */
router.get('/:id/rotation', payments.rotation);

/**
 * @swagger
 * /api/groups/{id}/history:
 *   get:
 *     summary: Historique des transactions du groupe
 *     tags: [Payments]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Historique des cotisations }
 */
router.get('/:id/history', payments.history);

export default router;
