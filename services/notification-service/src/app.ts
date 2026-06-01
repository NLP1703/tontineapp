import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { pool } from './db.js';
import { requireAuth } from './middleware/requireAuth.js';
import { metricsMiddleware, metricsHandler } from './metrics.js';
import { emitToUser } from './socket/notificationSocket.js';
import { sendDueReminders } from './cron/reminderCron.js';
import { emailUser } from './mailer.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(metricsMiddleware);

  app.get('/health', (_req, res) => res.json({ ok: true, service: 'notification-service' }));
  app.get('/metrics', metricsHandler);

  // Liste les notifications de l'utilisateur authentifié.
  app.get('/api/notify', requireAuth, async (req, res) => {
    const userId = (req as any).userId as string;
    const result = await pool.query(
      `SELECT id, title, body, type, read_at, created_at
       FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [userId]
    );
    res.json({ notifications: result.rows });
  });

  // Marque une notification comme lue.
  app.post('/api/notify/:id/read', requireAuth, async (req, res) => {
    const userId = (req as any).userId as string;
    await pool.query(
      `UPDATE notifications SET read_at = NOW() WHERE id = $1 AND user_id = $2`,
      [req.params.id, userId]
    );
    res.json({ ok: true });
  });

  // Endpoint interne : un autre service pousse une notification temps réel.
  // (En production, protéger via réseau interne K8s / clé partagée.)
  app.post('/internal/emit', async (req, res) => {
    const { userId, title, body, type } = req.body ?? {};
    if (!userId || !title || !body) {
      return res.status(400).json({ error: 'userId, title, body requis' });
    }
    await pool.query(
      `INSERT INTO notifications (user_id, title, body, type) VALUES ($1, $2, $3, $4)`,
      [userId, title, body, type ?? 'info']
    );
    emitToUser({ userId, title, body, type });
    // Envoi email en temps réel (ne bloque pas la réponse).
    emailUser(userId, title, body).catch(() => {});
    res.status(201).json({ ok: true });
  });

  // Déclenche manuellement les rappels d'échéance (utile pour les tests/démo).
  app.post('/internal/run-reminders', async (_req, res) => {
    const sent = await sendDueReminders();
    res.json({ ok: true, sent });
  });

  return app;
}
