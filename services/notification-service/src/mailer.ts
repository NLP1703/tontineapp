import nodemailer, { type Transporter } from 'nodemailer';

import { pool } from './db.js';

// Transport SMTP partagé. Par défaut : Mailpit (mailpit:1025) en développement.
let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'mailpit',
    port: Number(process.env.SMTP_PORT || 1025),
    secure: false,
    ...(process.env.SMTP_USER && process.env.SMTP_PASS
      ? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } }
      : {}),
  });
  return transporter;
}

// Envoie un email à une adresse. N'échoue jamais l'appelant.
export async function sendMail(to: string, subject: string, text: string): Promise<void> {
  const from = process.env.SMTP_FROM || 'TontineApp <no-reply@tontineapp.local>';
  try {
    await getTransporter().sendMail({ from, to, subject, text });
    // eslint-disable-next-line no-console
    console.log(`[mail] envoyé à ${to} — ${subject}`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[mail] échec envoi:', (err as Error).message);
  }
}

// Résout l'email d'un utilisateur puis lui envoie le message.
export async function emailUser(userId: string, subject: string, text: string): Promise<void> {
  const res = await pool.query<{ email: string }>(
    'SELECT email FROM users WHERE id = $1',
    [userId]
  );
  const email = res.rows[0]?.email;
  if (email) await sendMail(email, subject, text);
}
