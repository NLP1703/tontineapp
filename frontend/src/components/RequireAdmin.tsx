import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuthStore } from '../stores/authStore'

// Garde de route Admin : accessible UNIQUEMENT au rôle super_admin.
// Garde-fou cosmétique côté client — la vraie sécurité est appliquée côté
// serveur (requireRole) sur chaque endpoint /api/admin/*.
export default function RequireAdmin({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)

  if (!token) return <Navigate to="/login" replace />
  if (user?.role !== 'super_admin') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}
