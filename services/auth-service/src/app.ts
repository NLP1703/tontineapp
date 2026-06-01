import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';

import authRoutes from './routes/auth.js';
import { metricsMiddleware, metricsHandler } from './metrics.js';
import { swaggerSpec } from './swagger.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(metricsMiddleware);

  app.get('/health', (_req, res) => res.json({ ok: true, service: 'auth-service' }));
  app.get('/metrics', metricsHandler);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use('/api/auth', authRoutes);

  return app;
}
