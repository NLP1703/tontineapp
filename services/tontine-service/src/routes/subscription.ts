import { Router } from 'express';

import * as subscription from '../controllers/subscriptionController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

// Toutes les routes d'abonnement nécessitent une authentification.
router.use(requireAuth);

/**
 * @swagger
 * /api/subscription/plans:
 *   get:
 *     summary: Catalogue des plans Freemium (Gratuit, Standard, Premium)
 *     tags: [Subscription]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Liste des plans avec limites et prix }
 */
router.get('/plans', subscription.listPlans);

/**
 * @swagger
 * /api/subscription:
 *   get:
 *     summary: Abonnement courant de l'utilisateur + détail du plan
 *     tags: [Subscription]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Plan courant et abonnement }
 *   put:
 *     summary: Changer de plan (Freemium / upgrade)
 *     tags: [Subscription]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Plan mis à jour }
 *       400: { description: Plan invalide }
 */
router.get('/', subscription.current);
router.put('/', subscription.change);

/**
 * @swagger
 * /api/subscription/checkout:
 *   post:
 *     summary: Payer (simulation Mobile Money) puis activer un plan payant
 *     tags: [Subscription]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Paiement simulé réussi, plan activé }
 *       400: { description: Données invalides }
 */
router.post('/checkout', subscription.checkout);

export default router;
