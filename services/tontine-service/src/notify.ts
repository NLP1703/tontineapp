// Petit client vers le notification-service.
// Pousse une notification persistée + temps réel via /internal/emit.
// (Node 18+ fournit fetch globalement.)

const NOTIFY_URL = process.env.NOTIFICATION_URL || 'http://localhost:3003';

export async function emitNotification(input: {
  userId: string;
  title: string;
  body: string;
  type?: string;
}): Promise<void> {
  try {
    await fetch(`${NOTIFY_URL}/internal/emit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'payment', ...input }),
    });
  } catch (err) {
    // La cotisation ne doit pas échouer si la notification échoue : on logue seulement.
    console.error('[notify] emit failed:', (err as Error).message);
  }
}

// Notifie une liste d'utilisateurs en parallèle.
export async function emitToMany(
  userIds: string[],
  payload: { title: string; body: string; type?: string }
): Promise<void> {
  await Promise.all(userIds.map((userId) => emitNotification({ userId, ...payload })));
}
