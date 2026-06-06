import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, Wallet, Bell, Crown, User as UserIcon, LogOut } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { cn } from '../utils/cn'
import NotificationsListener from './NotificationsListener'

const links = [
  { to: '/dashboard', label: 'Tableau de bord', short: 'Accueil', icon: LayoutDashboard },
  { to: '/groups', label: 'Groupes', short: 'Groupes', icon: Users },
  { to: '/payments', label: 'Paiements', short: 'Paiements', icon: Wallet },
  { to: '/notifications', label: 'Notifications', short: 'Notifs', icon: Bell },
  { to: '/subscription', label: 'Abonnement', short: 'Abo', icon: Crown },
  { to: '/profile', label: 'Profil', short: 'Profil', icon: UserIcon },
]

export default function AppLayout() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  function onLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-white/20 bg-white/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <NavLink to="/dashboard" className="text-lg font-bold text-brand-blue">
            Tontine<span className="text-brand-orange">App</span>
          </NavLink>

          {/* Navigation principale : visible sur écran large, remplacée par la barre
              inférieure fixe sur mobile. */}
          <nav className="hidden sm:flex items-center gap-1 sm:gap-2">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition',
                    isActive
                      ? 'bg-brand-blue text-white'
                      : 'text-slate-700 hover:bg-white/70',
                  )
                }
              >
                <Icon size={18} />
                <span className="hidden lg:inline">{label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {user?.fullName && (
              <span className="hidden sm:inline text-sm text-slate-600">{user.fullName}</span>
            )}
            <button
              type="button"
              onClick={onLogout}
              aria-label="Déconnexion"
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-red-50 hover:text-red-600 transition"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      {/* pb-24 : laisse la place à la barre de navigation inférieure mobile. */}
      <main className="pb-24 sm:pb-0">
        <Outlet />
      </main>

      {/* Barre de navigation inférieure : mobile uniquement (pattern application).
          Plus lisible que 6 icônes serrées dans le header. */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-30 border-t border-white/20 bg-white/80 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-6">
          {links.map(({ to, short, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition',
                  isActive ? 'text-brand-blue' : 'text-slate-500 hover:text-slate-800',
                )
              }
            >
              <Icon size={20} />
              <span className="leading-none">{short}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Notifications temps réel (toasts via Socket.io) */}
      <NotificationsListener />
    </div>
  )
}
