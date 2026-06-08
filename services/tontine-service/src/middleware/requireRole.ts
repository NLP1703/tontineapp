import type { Request, Response, NextFunction } from 'express';

// Garde de rôle réutilisable. À chaîner APRÈS requireAuth (qui pose req.userRole
// depuis le JWT vérifié). La sécurité repose sur le serveur : le rôle vient du
// token signé, jamais d'une donnée fournie par le client.
//
// NB : copie identique de auth-service/src/middleware/requireRole.ts. Le monorepo
// n'a pas de package partagé ; chaque service garde sa copie locale.
export function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = (req as any).userRole as string | undefined;
    if (!role) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!roles.includes(role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient role' });
    }
    return next();
  };
}
