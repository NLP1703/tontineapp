import type { Request, Response, NextFunction } from 'express';
import client from 'prom-client';

// Registre Prometheus + métriques système par défaut (CPU, mémoire, event loop)
export const registry = new client.Registry();
registry.setDefaultLabels({ service: 'auth-service' });
client.collectDefaultMetrics({ register: registry });

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Nombre total de requêtes HTTP',
  labelNames: ['method', 'route', 'status'] as const,
  registers: [registry],
});

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Durée des requêtes HTTP en secondes',
  labelNames: ['method', 'route', 'status'] as const,
  buckets: [0.05, 0.1, 0.2, 0.3, 0.5, 1, 2, 5],
  registers: [registry],
});

// Middleware Express : mesure chaque requête (latence p95/p99 côté Prometheus)
export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    const route = req.route?.path ?? req.path;
    const labels = { method: req.method, route, status: String(res.statusCode) };
    httpRequestsTotal.inc(labels);
    end(labels);
  });
  next();
}

// Handler de la route GET /metrics scrapée par Prometheus
export async function metricsHandler(_req: Request, res: Response) {
  res.set('Content-Type', registry.contentType);
  res.end(await registry.metrics());
}
