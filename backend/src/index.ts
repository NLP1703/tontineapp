import dotenv from 'dotenv';
import { createApp } from './app.js';

dotenv.config();

const port = Number(process.env.PORT || 4000);

const app = createApp();
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`TontineApp API listening on http://localhost:${port}`);
});

