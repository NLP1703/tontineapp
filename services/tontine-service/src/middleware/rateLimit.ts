import type { Request, Response, NextFunction } from 'express';

// Limiteur de débit minimaliste en mémoire (copie de
// auth-service/src/middleware/rateLimit.ts). Sans dépendance externe : borne les
// routes admin sensibles. Compteur par instance/pod (cf. note dans auth-service).
export function rateLimit(opts: { windowMs: number; max: number }) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
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
