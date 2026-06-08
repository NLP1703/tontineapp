import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Même JWT_SECRET que l'auth-service : le token émis par auth-service est validé ici.
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }

  const token = auth.slice('Bearer '.length);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'change_me_secret');
    const sub = (payload as any).sub;
    if (!sub) return res.status(401).json({ error: 'Invalid token' });

    (req as any).userId = String(sub);
    // Rôle porté par le JWT signé par l'auth-service (défaut 'member' pour les
    // tokens hérités). Sert à requireRole pour protéger les routes admin.
    (req as any).userRole = (payload as any).role || 'member';
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
