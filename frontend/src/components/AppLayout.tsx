import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, Wallet, Bell, User as UserIcon, LogOut } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { cn } from '../utils/cn'
import NotificationsListener from './NotificationsListener'

const links = [
  { to: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/groups', label: 'Groupes', icon: Users },
  { to: '/payments', label: 'Paiements', icon: Wallet },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/profile', label: 'Profil', icon: UserIcon },
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

          <nav className="flex items-center gap-1 sm:gap-2">
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
                <span className="hidden sm:inline">{label}</span>
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
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-red-50 hover:text-red-600 transition"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      {/* Notifications temps réel (toasts via Socket.io) */}
      <NotificationsListener />
    </div>
  )
}
