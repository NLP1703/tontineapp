// =====================================================================
// Algorithme de rotation des bénéficiaires d'une tontine
// Fonctions pures => testables sans base de données.
// =====================================================================

export interface RotationMember {
  userId: string;
  rotationOrder: number;
  receivedAt: string | null; // null = n'a pas encore reçu la cagnotte
  reliabilityScore: number;
  payoutDate: string | null; // « date de bouffe » : date à laquelle le membre reçoit la cagnotte
}

/**
 * Compare deux membres selon l'ordre de passage piloté par la « date de bouffe » :
 * la date la plus proche passe en premier. Les membres sans date définie passent
 * après ceux qui en ont une ; à égalité, on retombe sur le `rotationOrder`.
 */
export function comparePassageOrder(a: RotationMember, b: RotationMember): number {
  const da = a.payoutDate ? new Date(a.payoutDate).getTime() : null;
  const db = b.payoutDate ? new Date(b.payoutDate).getTime() : null;
  if (da !== null && db !== null && da !== db) return da - db;
  if (da !== null && db === null) return -1; // a a une date, b non → a d'abord
  if (da === null && db !== null) return 1; // b a une date, a non → b d'abord
  return a.rotationOrder - b.rotationOrder; // dates égales ou toutes deux absentes
}

/**
 * Détermine le prochain bénéficiaire : parmi les membres n'ayant pas encore reçu,
 * celui dont la « date de bouffe » arrive en premier (à défaut de date, le plus
 * petit `rotationOrder`). Retourne undefined si tout le monde a déjà reçu.
 */
export function getNextBeneficiary(members: RotationMember[]): RotationMember | undefined {
  const pending = members
    .filter((m) => m.receivedAt === null)
    .sort(comparePassageOrder);
  return pending[0];
}

/**
 * Recommande un ordre de rotation optimal (module Innovation) :
 * les membres les plus fiables passent en premier. À score égal,
 * on conserve l'ordre initial pour rester déterministe.
 */
export function recommendRotationOrder(members: RotationMember[]): RotationMember[] {
  return [...members].sort((a, b) => {
    if (b.reliabilityScore !== a.reliabilityScore) {
      return b.reliabilityScore - a.reliabilityScore;
    }
    return a.rotationOrder - b.rotationOrder;
  });
}

/**
 * Indique si le cycle de rotation est complet (tous ont reçu la cagnotte).
 */
export function isCycleComplete(members: RotationMember[]): boolean {
  return members.length > 0 && members.every((m) => m.receivedAt !== null);
}
