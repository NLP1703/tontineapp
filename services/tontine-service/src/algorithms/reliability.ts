// =====================================================================
// Module Innovation — Score de fiabilité des membres
// Basé sur l'historique de paiement des 3 derniers mois.
// Fonctions pures => testables sans base de données.
// =====================================================================

export interface PaymentRecord {
  daysLate: number; // 0 = à temps ; > 0 = nombre de jours de retard
}

/**
 * Calcule un score de fiabilité [0..100] pour un membre.
 * Formule (cf. README) :
 *   (paiements à temps / total) * 100  -  (retard moyen * 5)
 * Le résultat est borné dans [0, 100].
 */
export function calculateReliabilityScore(payments: PaymentRecord[]): number {
  if (payments.length === 0) return 100; // nouveau membre : bénéfice du doute

  const onTime = payments.filter((p) => p.daysLate === 0).length;
  const avgDelay =
    payments.reduce((acc, p) => acc + p.daysLate, 0) / payments.length;

  const raw = (onTime / payments.length) * 100 - avgDelay * 5;
  return Math.max(0, Math.min(100, Math.round(raw * 100) / 100));
}

/**
 * Un membre est considéré "à risque" si son score est sous le seuil.
 * Utilisé par le notification-service pour les alertes préventives.
 */
export function isAtRisk(score: number, threshold = 60): boolean {
  return score < threshold;
}
