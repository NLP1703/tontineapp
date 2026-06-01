import cron from 'node-cron';

import { pool } from '../db.js';
import { emitToUser } from '../socket/notificationSocket.js';
import { sendMail } from '../mailer.js';

const SCHEDULE = process.env.REMINDER_CRON || '0 9 * * *'; // tous les jours à 9h
const DAYS_BEFORE = Number(process.env.REMINDER_DAYS_BEFORE || 3);

// Prochaine date limite à partir du jour de paiement récurrent.
//   monthly        -> payment_day = jour du mois (1..28)
//   weekly/biweekly -> payment_day = jour de semaine (1=lundi..7=dimanche)
function computeNextDeadline(paymentDay: number, frequency: string, from: Date = new Date()): Date {
  if (frequency === 'monthly') {
    let target = new Date(from.getFullYear(), from.getMonth(), paymentDay, 23, 59, 0, 0);
    if (target.getTime() < from.getTime()) {
      target = new Date(from.getFullYear(), from.getMonth() + 1, paymentDay, 23, 59, 0, 0);
    }
    return target;
  }
  const targetDow = paymentDay % 7; // 7 (dimanche) -> 0
  const target = new Date(from.getFullYear(), from.getMonth(), from.getDate(), 23, 59, 0, 0);
  let diff = (targetDow - target.getDay() + 7) % 7;
  if (diff === 0 && target.getTime() < from.getTime()) diff = 7;
  target.setDate(target.getDate() + diff);
  return target;
}

// Pour chaque groupe ayant un jour de paiement récurrent, (re)calcule la date
// limite du cycle si elle est absente ou déjà dépassée. Ainsi les rappels
// repartent automatiquement à chaque nouveau cycle.
export async function refreshAutoDeadlines(): Promise<number> {
  const res = await pool.query<{ id: string; frequency: string; payment_day: number; payment_deadline: string | null }>(
    `SELECT id, frequency, payment_day, payment_deadline
     FROM tontines
     WHERE payment_day IS NOT NULL
       AND (payment_deadline IS NULL OR payment_deadline < NOW())`
  );
  for (const t of res.rows) {
    const next = computeNextDeadline(t.payment_day, t.frequency);
    await pool.query('UPDATE tontines SET payment_deadline = $2 WHERE id = $1', [t.id, next.toISOString()]);
  }
  return res.rows.length;
}

interface DueMember {
  user_id: string;
  email: string;
  tontine_name: string;
  payment_deadline: string;
}

// Persiste la notification, l'émet en temps réel (Socket.io) et l'envoie par email.
async function notify(userId: string, email: string, title: string, body: string, type: string) {
  await pool.query(
    `INSERT INTO notifications (user_id, title, body, type) VALUES ($1, $2, $3, $4)`,
    [userId, title, body, type]
  );
  emitToUser({ userId, title, body, type: type as any });
  if (email) await sendMail(email, title, body);
}

// Recherche les groupes dont la date limite arrive dans les N prochains jours
// et rappelle les membres qui n'ont PAS encore cotisé pour le cycle courant
// (cf. README — alertes avant échéance).
export async function sendDueReminders() {
  // Régénère d'abord les échéances pilotées par le jour de paiement récurrent.
  await refreshAutoDeadlines();

  const res = await pool.query<DueMember>(
    `SELECT m.user_id, u.email, t.name AS tontine_name, t.payment_deadline
     FROM tontines t
     JOIN tontine_members m ON m.tontine_id = t.id
     JOIN users u ON u.id = m.user_id
     WHERE t.payment_deadline IS NOT NULL
       AND t.payment_deadline BETWEEN NOW() AND NOW() + ($1 || ' days')::interval
       AND NOT EXISTS (
         SELECT 1 FROM payments p
         WHERE p.tontine_id = t.id
           AND p.user_id = m.user_id
           AND p.cycle = t.current_cycle
       )`,
    [DAYS_BEFORE]
  );

  for (const row of res.rows) {
    const when = new Date(row.payment_deadline).toLocaleString('fr-FR', {
      dateStyle: 'long',
      timeStyle: 'short',
    });
    await notify(
      row.user_id,
      row.email,
      `Rappel de cotisation — ${row.tontine_name}`,
      `Vous n'avez pas encore cotisé. Date limite : ${when}.`,
      'reminder'
    );
  }

  // eslint-disable-next-line no-console
  console.log(`[cron] ${res.rows.length} rappel(s) envoyé(s)`);
  return res.rows.length;
}

export function startReminderCron(): void {
  cron.schedule(SCHEDULE, () => {
    sendDueReminders().catch((err) => {
      // eslint-disable-next-line no-console
      console.error('[cron] erreur lors de l’envoi des rappels:', err);
    });
  });
  // eslint-disable-next-line no-console
  console.log(`[cron] planificateur de rappels actif (${SCHEDULE})`);
}
