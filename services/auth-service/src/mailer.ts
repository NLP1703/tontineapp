import nodemailer, { type Transporter } from 'nodemailer';

// Transport SMTP partagé. Par défaut : Mailpit (mailpit:1025) en développement.
let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST || 'mailpit';
  const port = Number(process.env.SMTP_PORT || 1025);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  transporter = nodemailer.createTransport({
    host,
    port,
    // STARTTLS opportuniste ; Mailpit accepte le clair sur 1025.
    secure: false,
    // Timeouts courts : un SMTP injoignable ne doit jamais bloquer la requête HTTP
    // (inscription / connexion) plus de quelques secondes.
    connectionTimeout: 7000,
    greetingTimeout: 7000,
    socketTimeout: 10000,
    ...(user && pass ? { auth: { user, pass } } : {}),
  });
  return transporter;
}

// Envoie un email. N'échoue jamais l'appelant : log en cas d'erreur.
export async function sendMail(to: string, subject: string, text: string, html?: string): Promise<void> {
  const from = process.env.SMTP_FROM || 'TontineApp <no-reply@tontineapp.local>';
  try {
    await getTransporter().sendMail({ from, to, subject, text, html });
    // eslint-disable-next-line no-console
    console.log(`[mail] envoyé à ${to} — ${subject}`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[mail] échec envoi:', (err as Error).message);
  }
}
