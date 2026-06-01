import type { Server as HttpServer } from 'http';
import { Server as IOServer, type Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

import { activeWebsockets, notificationsSent } from '../metrics.js';

export interface NotificationPayload {
  userId: string;
  title: string;
  body: string;
  type?: 'info' | 'payment' | 'reminder' | 'alert';
}

let io: IOServer | null = null;

// Initialise Socket.io avec authentification JWT (handshake.auth.token).
export function initSocket(httpServer: HttpServer): IOServer {
  io = new IOServer(httpServer, {
    cors: { origin: true, credentials: true },
  });

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error('Missing token'));
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'change_me_secret');
      const sub = (payload as any).sub;
      if (!sub) return next(new Error('Invalid token'));
      // Chaque utilisateur rejoint une "room" privée pour des notifs ciblées.
      socket.data.userId = String(sub);
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId as string;
    socket.join(`user:${userId}`);
    activeWebsockets.inc();

    socket.on('disconnect', () => {
      activeWebsockets.dec();
    });
  });

  return io;
}

// Émet une notification temps réel vers un utilisateur précis.
export function emitToUser(payload: NotificationPayload): void {
  if (!io) return;
  io.to(`user:${payload.userId}`).emit('notification', payload);
  notificationsSent.inc({ type: payload.type ?? 'info' });
}
