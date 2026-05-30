import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import authRoutes from './routes/auth.js';


export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({
    origin: true,
    credentials: true,
  }));

  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => res.json({ ok: true }));
  app.use('/api/auth', authRoutes);

  return app;
}

