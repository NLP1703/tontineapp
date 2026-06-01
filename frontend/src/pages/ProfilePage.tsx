import { useEffect, useState } from 'react'
import { User as UserIcon, Mail, BadgeCheck } from 'lucide-react'
import { me, type AuthUser } from '../services/auth'
import { useAuthStore } from '../stores/authStore'
import { apiError } from '../services/api'

export default function ProfilePage() {
  const storeUser = useAuthStore((s) => s.user)
  const [user, setUser] = useState<AuthUser | null>(storeUser)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    me()
      .then(setUser)
      .catch((err) => setError(apiError(err, 'Profil indisponible')))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Mon profil</h1>
        <p className="mt-2 text-sm text-slate-600">Informations de votre compte.</p>

        {error && <div className="mt-4 rounded-xl bg-red-50 ring-1 ring-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="mt-6 rounded-2xl glass ring-1 ring-white/20 p-6 shadow-soft">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-brand-blue to-brand-orange ring-1 ring-white/30 flex items-center justify-center text-white">
              <UserIcon size={28} />
            </div>
            <div>
              <div className="text-lg font-semibold text-slate-900">
                {loading ? '…' : user?.fullName ?? 'Utilisateur'}
              </div>
              <div className="text-sm text-slate-600">{user?.email ?? '—'}</div>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <Row icon={<UserIcon size={18} />} label="Nom complet" value={user?.fullName ?? '—'} />
            <Row icon={<Mail size={18} />} label="Email" value={user?.email ?? '—'} />
            <Row icon={<BadgeCheck size={18} />} label="Identifiant" value={user?.id ?? '—'} />
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white/50 ring-1 ring-slate-200/60 px-4 py-3">
      <span className="text-brand-blue">{icon}</span>
      <span className="text-sm text-slate-600 w-32">{label}</span>
      <span className="text-sm font-medium text-slate-900 break-all">{value}</span>
    </div>
  )
}
