import { tontineApi } from './api'

export interface Group {
  id: string
  owner_user_id: string
  name: string
  description: string | null
  contribution_amount: string
  frequency: string
  current_cycle: number
  status: string
  payment_deadline?: string | null
  payment_day?: number | null
  // Capacité choisie à la création (nombre de participants) ; null = plafond du plan seul.
  max_members?: number | null
}

// Cagnotte du groupe : total cumulé (tous cycles) et total du cycle courant.
export interface GroupTotals {
  allTime: number
  currentCycle: number
}

// Occupation du groupe : membres actuels et capacité maximale (null = pas de plafond propre).
export interface GroupCapacity {
  memberCount: number
  maxMembers: number | null
}

export interface Rubric {
  id: string
  tontine_id: string
  name: string
  amount: string
}

export interface Member {
  id: string
  user_id: string
  rotation_order: number
  received_at: string | null
  reliability_score: string
  payout_date?: string | null
  full_name?: string
  phone?: string | null
  has_paid?: boolean
}

export interface Payment {
  id: string
  user_id: string
  amount: string
  status: string
  days_late: number
  rubric?: string | null
  sender_phone?: string | null
  receiver_phone?: string | null
  full_name?: string
  created_at: string
}

export async function listGroups() {
  const { data } = await tontineApi.get('/api/groups')
  return data.groups as Group[]
}

// Récapitulatif RÉEL du tableau de bord : groupes de l'utilisateur, total qu'il a
// effectivement cotisé, détail par groupe et série mensuelle (6 derniers mois).
export interface DashboardSummary {
  groups: Group[]
  totalContributed: number
  // tontineId -> montant réellement cotisé par l'utilisateur dans ce groupe
  perGroup: Record<string, number>
  series: Array<{ label: string; amount: number }>
}

export async function getDashboardSummary() {
  const { data } = await tontineApi.get('/api/groups/summary')
  return data as DashboardSummary
}

export async function createGroup(input: {
  name: string
  description?: string
  contributionAmount: number
  frequency: string
  paymentDay?: number | null
  maxMembers?: number | null
  rubrics?: Array<{ name: string; amount: number }>
}) {
  const { data } = await tontineApi.post('/api/groups', input)
  return data.group as Group
}

export async function getGroup(id: string) {
  const { data } = await tontineApi.get(`/api/groups/${id}`)
  return data as {
    group: Group
    members: Member[]
    rubrics: Rubric[]
    totals: GroupTotals
    capacity: GroupCapacity
  }
}

// Ajoute un membre par email OU numéro de téléphone (réservé au créateur).
export async function addMember(id: string, identifier: string) {
  const { data } = await tontineApi.post(`/api/groups/${id}/members`, { identifier })
  return data.member as Member
}

// Retire un membre du groupe (réservé au créateur).
export async function removeMember(id: string, userId: string) {
  await tontineApi.delete(`/api/groups/${id}/members/${userId}`)
}

// Définit la date limite de paiement (réservé au créateur). ISO 8601 ou null.
export async function setDeadline(id: string, deadline: string | null) {
  const { data } = await tontineApi.patch(`/api/groups/${id}/deadline`, { deadline })
  return data.group as Group
}

// Définit la « date de bouffe » d'un membre (réservé au créateur). YYYY-MM-DD ou null.
export async function setMemberPayoutDate(id: string, userId: string, payoutDate: string | null) {
  await tontineApi.patch(`/api/groups/${id}/members/${userId}/payout-date`, { payoutDate })
}

export async function contribute(
  id: string,
  input: {
    amount?: number
    senderPhone: string
    receiverPhone: string
    rubric?: string
    payAll?: boolean
    daysLate?: number
  },
) {
  const { data } = await tontineApi.post(`/api/groups/${id}/contribute`, input)
  return data as { payments: Payment[]; reliabilityScore: number }
}

export async function getRotation(id: string) {
  const { data } = await tontineApi.get(`/api/groups/${id}/rotation`)
  return data as {
    currentOrder: Array<{ userId: string; rotationOrder: number; reliabilityScore: number }>
    recommendedOrder: Array<{ userId: string; reliabilityScore: number }>
    nextBeneficiary: { userId: string } | null
  }
}

export async function getHistory(id: string) {
  const { data } = await tontineApi.get(`/api/groups/${id}/history`)
  return data.payments as Payment[]
}
