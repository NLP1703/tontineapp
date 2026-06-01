import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

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
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
