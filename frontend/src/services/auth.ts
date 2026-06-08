import { authApi } from './api'

export type UserRole = 'member' | 'group_admin' | 'super_admin'

export interface AuthUser {
  id: string
  fullName?: string
  email?: string
  phone?: string | null
  role?: UserRole
}

// L'inscription ne connecte pas tout de suite : un OTP est envoyé par email.
export async function register(fullName: string, email: string, password: string, phone?: string) {
  const { data } = await authApi.post('/api/auth/register', { fullName, email, password, phone })
  return data as { requiresOtp: boolean; email: string; debugOtp?: string }
}

export async function login(email: string, password: string) {
  const { data } = await authApi.post('/api/auth/login', { email, password })
  return data as { token: string; user: AuthUser }
}

export async function forgotPassword(email: string) {
  const { data } = await authApi.post('/api/auth/password/forgot', { email })
  return data as { ok: boolean; debugOtp?: string }
}

export async function verifyOtp(email: string, otp: string) {
  const { data } = await authApi.post('/api/auth/otp/verify', { email, otp })
  return data as { token: string; user: AuthUser }
}

// Réinitialise le mot de passe avec l'OTP reçu par email puis connecte l'utilisateur.
export async function resetPassword(email: string, otp: string, newPassword: string) {
  const { data } = await authApi.post('/api/auth/password/reset', { email, otp, newPassword })
  return data as { token: string; user: AuthUser }
}

// Détecte une erreur Axios « email non vérifié » (HTTP 403 avec requiresOtp).
export function requiresOtp(err: unknown): { email: string } | null {
  const e = err as { response?: { data?: { requiresOtp?: boolean; email?: string } } }
  if (e?.response?.data?.requiresOtp) return { email: e.response.data.email ?? '' }
  return null
}

export async function me() {
  const { data } = await authApi.get('/api/auth/me')
  return data.user as AuthUser
}
