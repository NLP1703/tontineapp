// =====================================================================
// Plans d'abonnement Freemium de TontineApp.
// Le plan du PROPRIÉTAIRE d'un groupe détermine le nombre maximum de
// membres autorisés dans ce groupe. C'est le socle de la monétisation :
// au-delà de la limite, le propriétaire doit passer à un plan supérieur.
// =====================================================================

export type PlanId = 'free' | 'standard' | 'premium';

export interface Plan {
  id: PlanId;
  label: string;
  // Nombre maximum de membres par groupe ; null = illimité.
  maxMembersPerGroup: number | null;
  // Prix mensuel indicatif (FCFA) — utilisé par le frontend / la facturation.
  priceFcfa: number;
}

export const PLANS: Record<PlanId, Plan> = {
  free: { id: 'free', label: 'Gratuit', maxMembersPerGroup: 10, priceFcfa: 0 },
  standard: { id: 'standard', label: 'Standard', maxMembersPerGroup: 30, priceFcfa: 2000 },
  premium: { id: 'premium', label: 'Premium', maxMembersPerGroup: null, priceFcfa: 5000 },
};

export const DEFAULT_PLAN: PlanId = 'free';

export function isPlanId(value: string): value is PlanId {
  return value === 'free' || value === 'standard' || value === 'premium';
}

// Retourne le plan demandé, ou le plan gratuit par défaut si inconnu.
export function getPlan(planId: string | null | undefined): Plan {
  return planId && isPlanId(planId) ? PLANS[planId] : PLANS[DEFAULT_PLAN];
}
