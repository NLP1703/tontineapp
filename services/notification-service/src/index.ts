// Charge .env AVANT tout autre import (les imports ESM sont évalués en premier ;
// db.ts lit DATABASE_URL au chargement du module).
import 'dotenv/config';
import { createServer } from 'http';

import { createApp } from './app.js';
import { initSocket } from './socket/notificationSocket.js';
import { startReminderCron } from './cron/reminderCron.js';

const port = Number(process.env.PORT || 3003);

const app = createApp();
const httpServer = createServer(app);

// Socket.io partage le même serveur HTTP qu'Express.
initSocket(httpServer);

// Planificateur de rappels automatiques.
startReminderCron();

httpServer.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`notification-service listening on http://localhost:${port} (HTTP + Socket.io)`);
});
