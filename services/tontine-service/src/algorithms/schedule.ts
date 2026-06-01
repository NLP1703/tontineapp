// =====================================================================
// Calcul de la prochaine date limite de cotisation à partir du
// « jour de paiement » récurrent (payment_day) et de la fréquence.
// Fonction pure => testable sans base de données.
//   - frequency = monthly        -> payment_day = jour du mois (1..28)
//   - frequency = weekly/biweekly -> payment_day = jour de semaine (1=lundi..7=dimanche)
// L'échéance est fixée à la fin de la journée cible (23:59).
// =====================================================================

export function computeNextDeadline(
  paymentDay: number,
  frequency: string,
  from: Date = new Date()
): Date {
  if (frequency === 'monthly') {
    let target = new Date(from.getFullYear(), from.getMonth(), paymentDay, 23, 59, 0, 0);
    // Si le jour est déjà passé ce mois-ci, viser le mois suivant.
    if (target.getTime() < from.getTime()) {
      target = new Date(from.getFullYear(), from.getMonth() + 1, paymentDay, 23, 59, 0, 0);
    }
    return target;
  }

  // weekly / biweekly : prochaine occurrence du jour de la semaine.
  // payment_day : 1=lundi..7=dimanche ; Date.getDay() : 0=dimanche..6=samedi.
  const targetDow = paymentDay % 7; // 7 (dimanche) -> 0
  const target = new Date(from.getFullYear(), from.getMonth(), from.getDate(), 23, 59, 0, 0);
  let diff = (targetDow - target.getDay() + 7) % 7;
  // Si c'est aujourd'hui mais l'heure limite est déjà dépassée, viser la semaine suivante.
  if (diff === 0 && target.getTime() < from.getTime()) diff = 7;
  target.setDate(target.getDate() + diff);
  return target;
}
