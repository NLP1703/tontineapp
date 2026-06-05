import { tontineApi } from './api'

export type PlanId = 'free' | 'standard' | 'premium'

export interface Plan {
  id: PlanId
  label: string
  // null = nombre de membres illimité par groupe.
  maxMembersPerGroup: number | null
  priceFcfa: number
}

export interface Subscription {
  id: string
  user_id: string
  plan: PlanId
  status: string
  started_at: string
  expires_at: string | null
}

// Catalogue des plans Freemium proposés.
export async function getPlans() {
  const { data } = await tontineApi.get('/api/subscription/plans')
  return data.plans as Plan[]
}

// Abonnement courant de l'utilisateur (+ détail du plan effectif).
export async function getCurrentSubscription() {
  const { data } = await tontineApi.get('/api/subscription')
  return data as { plan: Plan; subscription: Subscription | null }
}

// Change le plan de l'utilisateur (upgrade / downgrade).
export async function changePlan(plan: PlanId) {
  const { data } = await tontineApi.put('/api/subscription', { plan })
  return data as { plan: Plan; subscription: Subscription }
}
