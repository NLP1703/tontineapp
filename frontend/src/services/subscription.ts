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

// Change le plan de l'utilisateur (upgrade / downgrade). Utilisé pour les plans gratuits.
export async function changePlan(plan: PlanId) {
  const { data } = await tontineApi.put('/api/subscription', { plan })
  return data as { plan: Plan; subscription: Subscription }
}

export interface SimulatedPayment {
  status: string
  simulated: boolean
  reference: string
  amountFcfa: number
  phone: string
}

// Paie (simulation Mobile Money) puis active un plan payant.
export async function checkoutPlan(plan: PlanId, phone: string) {
  const { data } = await tontineApi.post('/api/subscription/checkout', { plan, phone })
  return data as { plan: Plan; subscription: Subscription; payment: SimulatedPayment }
}
