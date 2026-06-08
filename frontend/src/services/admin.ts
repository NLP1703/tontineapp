import { authApi, tontineApi } from './api'
import type { UserRole } from './auth'

// =====================================================================
// Client API du module Admin. Toutes ces routes exigent le rôle super_admin
// (vérifié côté serveur). La gestion des utilisateurs/audit passe par
// l'auth-service ; les groupes/transactions/stats par le tontine-service.
// =====================================================================

export interface AdminUser {
  id: string
  full_name: string
  email: string
  phone: string | null
  role: UserRole
  is_active: boolean
  created_at?: string
}

export interface Paginated<T> {
  total: number
  page: number
  pageSize: number
  items: T[]
}

// --- Utilisateurs (auth-service) ---

export async function listUsers(params: { page?: number; pageSize?: number; search?: string } = {}) {
  const { data } = await authApi.get('/api/auth/users', { params })
  return { items: data.users as AdminUser[], total: data.total, page: data.page, pageSize: data.pageSize }
}

export async function setUserRole(id: string, role: UserRole) {
  const { data } = await authApi.patch(`/api/auth/users/${id}/role`, { role })
  return data.user as AdminUser
}

export async function disableUser(id: string) {
  const { data } = await authApi.delete(`/api/auth/users/${id}`)
  return data.user as AdminUser
}

export async function getUserStats() {
  const { data } = await authApi.get('/api/auth/admin/stats')
  return data as { totalUsers: number }
}

// --- Journal d'audit (auth-service) ---

export interface AuditLog {
  id: string
  admin_id: string
  admin_name?: string
  admin_email?: string
  action: string
  target_type: string
  target_id: string | null
  details: Record<string, unknown>
  created_at: string
}

export async function listAudit(
  params: { page?: number; pageSize?: number; action?: string; adminId?: string; from?: string; to?: string } = {},
) {
  const { data } = await authApi.get('/api/auth/admin/audit', { params })
  return { items: data.logs as AuditLog[], total: data.total, page: data.page, pageSize: data.pageSize }
}

// --- Groupes (tontine-service) ---

export interface AdminGroup {
  id: string
  name: string
  status: string
  current_cycle: number
  contribution_amount: string
  max_members: number | null
  created_at: string
  owner_user_id: string
  owner_name: string | null
  member_count: number
  total_collected: number
}

export async function listGroups() {
  const { data } = await tontineApi.get('/api/admin/groups')
  return data.groups as AdminGroup[]
}

export async function getGroupDetails(id: string) {
  const { data } = await tontineApi.get(`/api/admin/groups/${id}`)
  return data as Record<string, unknown>
}

export async function forceRotation(id: string) {
  const { data } = await tontineApi.post(`/api/admin/groups/${id}/force-rotation`)
  return data as { ok: boolean; beneficiary: string; cycleAdvanced: boolean }
}

export async function dissolveGroup(id: string) {
  await tontineApi.delete(`/api/admin/groups/${id}`)
}

// --- Transactions (tontine-service) ---

export interface AdminTransaction {
  id: string
  user_id: string
  tontine_id: string
  cycle: number
  amount: string
  days_late: number
  status: string
  rubric: string | null
  created_at: string
  full_name: string | null
  tontine_name: string | null
}

export async function listTransactions(
  params: { page?: number; pageSize?: number; status?: string; tontineId?: string; from?: string; to?: string } = {},
) {
  const { data } = await tontineApi.get('/api/admin/transactions', { params })
  return {
    items: data.transactions as AdminTransaction[],
    total: data.total,
    page: data.page,
    pageSize: data.pageSize,
  }
}

export async function validateTransaction(id: string) {
  const { data } = await tontineApi.patch(`/api/admin/transactions/${id}/validate`)
  return data.transaction as AdminTransaction
}

// --- Statistiques & alertes (tontine-service) ---

export interface AdminStats {
  activeGroups: number
  contributionsThisMonth: number
  weeklySeries: Array<{ label: string; amount: number }>
  lateRate: number
}

export async function getStats() {
  const { data } = await tontineApi.get('/api/admin/stats')
  return data as AdminStats
}

export interface LatePaymentAlert {
  payment_id: string
  user_id: string
  full_name: string | null
  tontine_id: string
  tontine_name: string | null
  days_late: number
  amount: string
}

export interface DisputedGroup {
  tontine_id: string
  tontine_name: string | null
  count: number
}

export async function getAlerts() {
  const { data } = await tontineApi.get('/api/admin/alerts')
  return data as { latePayments: LatePaymentAlert[]; disputedGroups: DisputedGroup[] }
}
