import type { Request, Response, NextFunction } from 'express';

// Limiteur de débit minimaliste en mémoire (fenêtre glissante par compteur).
// Sans dépendance externe : suffisant pour borner les routes admin sensibles.
// NB : le compteur est par instance/pod. Avec plusieurs réplicas, la limite
// effective est multipliée par le nombre de pods — acceptable comme garde-fou.
// Pour une limite stricte globale, déporter vers Redis ou le rate limiting Nginx.
export function rateLimit(opts: { windowMs: number; max: number }) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    // Clé : utilisateur authentifié si disponible, sinon IP.
    const key = (req as any).userId || req.ip || 'anonymous';

    const entry = hits.get(key);
    if (!entry || now > entry.resetAt) {
      hits.set(key, { count: 1, resetAt: now + opts.windowMs });
      return next();
    }

    entry.count += 1;
    if (entry.count > opts.max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({ error: 'Too many requests' });
    }
    return next();
  };
}
