// Charge .env AVANT tout autre import (les imports ESM sont évalués en premier ;
// db.ts lit DATABASE_URL au chargement du module).
import 'dotenv/config';
import { createApp } from './app.js';

const port = Number(process.env.PORT || 3002);

const app = createApp();
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`tontine-service listening on http://localhost:${port}`);
});
