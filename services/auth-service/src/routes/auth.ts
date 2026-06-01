import { Router } from 'express';

import * as ctrl from '../controllers/authController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Inscription d'un utilisateur
 *     tags: [Auth]
 *     responses:
 *       201: { description: Utilisateur créé }
 *       409: { description: Email déjà utilisé }
 */
router.post('/register', ctrl.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Connexion, retourne un JWT
 *     tags: [Auth]
 *     responses:
 *       200: { description: Token JWT + profil }
 *       401: { description: Identifiants invalides }
 */
router.post('/login', ctrl.login);

/**
 * @swagger
 * /api/auth/password/forgot:
 *   post:
 *     summary: Demande de réinitialisation (génère un OTP)
 *     tags: [Auth]
 *     responses:
 *       200: { description: OTP généré (toujours 200 pour éviter l'énumération) }
 */
router.post('/password/forgot', ctrl.forgotPassword);

/**
 * @swagger
 * /api/auth/otp/verify:
 *   post:
 *     summary: Vérifie un OTP et retourne un JWT
 *     tags: [Auth]
 *     responses:
 *       200: { description: Token JWT }
 *       400: { description: OTP invalide ou expiré }
 */
router.post('/otp/verify', ctrl.verifyOtp);

/**
 * @swagger
 * /api/auth/password/reset:
 *   post:
 *     summary: Réinitialise le mot de passe via OTP
 *     tags: [Auth]
 *     responses:
 *       200: { description: Mot de passe modifié, retourne un JWT }
 *       400: { description: OTP invalide ou expiré }
 */
router.post('/password/reset', ctrl.resetPassword);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Profil de l'utilisateur authentifié
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Profil utilisateur }
 *       401: { description: Token manquant ou invalide }
 */
router.get('/me', requireAuth, ctrl.me);

export default router;
