import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';

import groupsRoutes from './routes/groups.js';
import subscriptionRoutes from './routes/subscription.js';
import adminRoutes from './routes/admin.js';
import { metricsMiddleware, metricsHandler } from './metrics.js';
import { swaggerSpec } from './swagger.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(metricsMiddleware);

  app.get('/health', (_req, res) => res.json({ ok: true, service: 'tontine-service' }));
  app.get('/metrics', metricsHandler);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use('/api/groups', groupsRoutes);
  app.use('/api/subscription', subscriptionRoutes);
  // Routes d'administration (groupes, transactions, stats). Le routeur applique
  // lui-même requireAuth + requireRole(super_admin) + rate limit.
  app.use('/api/admin', adminRoutes);

  return app;
}
