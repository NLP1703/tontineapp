// Seed du super_admin par défaut.
//   Local : tsx src/seedAdmin.ts      Prod (image buildée) : node dist/seedAdmin.js
//
// Idempotent : ne fait RIEN s'il existe déjà au moins un super_admin. Sinon,
// promeut le compte ADMIN_EMAIL s'il existe, ou le crée à partir de
// ADMIN_EMAIL / ADMIN_PASSWORD.
//
// Charge .env AVANT les imports qui lisent DATABASE_URL (cf. index.ts).
import 'dotenv/config';
import bcrypt from 'bcryptjs';

import { pool } from './db.js';
import * as Users from './models/user.js';

async function seedAdmin(): Promise<void> {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('[seedAdmin] ADMIN_EMAIL et ADMIN_PASSWORD sont requis. Abandon.');
    return;
  }

  if (await Users.existsSuperAdmin()) {
    console.log('[seedAdmin] Un super_admin existe déjà — rien à faire.');
    return;
  }

  // Pas de super_admin : promouvoir le compte existant ou le créer.
  const existing = await Users.findByEmail(email);
  if (existing) {
    await Users.setRole(existing.id, 'super_admin');
    console.log(`[seedAdmin] Compte existant ${email} promu super_admin.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await Users.createWithRole('Super Admin', email, passwordHash, 'super_admin');
  console.log(`[seedAdmin] super_admin créé : ${email} (id=${user.id}).`);
}

seedAdmin()
  .catch((err) => {
    console.error('[seedAdmin] Échec :', err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
