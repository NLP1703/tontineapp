import type { Request, Response, NextFunction } from 'express';
import client from 'prom-client';

export const registry = new client.Registry();
registry.setDefaultLabels({ service: 'notification-service' });
client.collectDefaultMetrics({ register: registry });

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Nombre total de requêtes HTTP',
  labelNames: ['method', 'route', 'status'] as const,
  registers: [registry],
});

// Connexions WebSocket actives (cf. README — métrique surveillée)
export const activeWebsockets = new client.Gauge({
  name: 'websocket_connections_active',
  help: 'Nombre de connexions WebSocket actives',
  registers: [registry],
});

// Notifications envoyées (par type)
export const notificationsSent = new client.Counter({
  name: 'notifications_sent_total',
  help: 'Nombre total de notifications envoyées',
  labelNames: ['type'] as const,
  registers: [registry],
});

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  res.on('finish', () => {
    httpRequestsTotal.inc({
      method: req.method,
      route: req.route?.path ?? req.path,
      status: String(res.statusCode),
    });
  });
  next();
}

export async function metricsHandler(_req: Request, res: Response) {
  res.set('Content-Type', registry.contentType);
  res.end(await registry.metrics());
}
