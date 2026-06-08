import type { Request, Response, NextFunction } from 'express';

// Garde de rôle réutilisable. À chaîner APRÈS requireAuth (qui pose req.userRole
// depuis le JWT vérifié). La sécurité repose sur le serveur : le rôle vient du
// token signé, jamais d'une donnée fournie par le client.
//
// NB : ce fichier est volontairement dupliqué à l'identique dans chaque service
// (auth-service, tontine-service). Le monorepo n'a pas de package partagé ;
// garder une copie locale évite un couplage de build entre services.
export function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = (req as any).userRole as string | undefined;
    if (!role) {
      // requireRole utilisé sans requireAuth en amont : refus par défaut.
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!roles.includes(role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient role' });
    }
    return next();
  };
}
