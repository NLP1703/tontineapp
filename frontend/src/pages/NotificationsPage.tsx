import { useEffect, useState } from 'react'
import { Bell, Check } from 'lucide-react'
import { listNotifications, markNotificationRead, type Notification } from '../services/notifications'
import { apiError } from '../services/api'

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listNotifications()
      .then(setItems)
      .catch((err) => setError(apiError(err, 'Chargement des notifications impossible')))
      .finally(() => setLoading(false))
  }, [])

  async function onRead(id: string) {
    try {
      await markNotificationRead(id)
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)))
    } catch (err) {
      setError(apiError(err, 'Action impossible'))
    }
  }

  const unread = items.filter((n) => !n.read_at).length

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Notifications</h1>
            <p className="mt-2 text-sm text-slate-600">
              {unread > 0 ? `${unread} non lue${unread > 1 ? 's' : ''}` : 'Tout est à jour.'}
            </p>
          </div>
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-blue to-brand-orange text-white ring-1 ring-white/30">
            <Bell size={22} />
          </span>
        </div>

        {error && <div className="mt-4 rounded-xl bg-red-50 ring-1 ring-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="mt-6 space-y-3">
          {loading ? (
            <p className="text-sm text-slate-600">Chargement…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-slate-600">Aucune notification.</p>
          ) : (
            items.map((n) => (
              <div
                key={n.id}
                className={
                  'flex items-start gap-3 rounded-2xl ring-1 p-4 shadow-soft ' +
                  (n.read_at ? 'bg-white/40 ring-slate-200/60' : 'glass ring-white/30')
                }
              >
                <span className={'mt-0.5 ' + (n.read_at ? 'text-slate-400' : 'text-brand-orange')}>
                  <Bell size={18} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-900">{n.title}</div>
                  <div className="text-sm text-slate-600 mt-0.5">{n.body}</div>
                  <div className="text-xs text-slate-400 mt-1">{new Date(n.created_at).toLocaleString()}</div>
                </div>
                {!n.read_at && (
                  <button
                    type="button"
                    onClick={() => onRead(n.id)}
                    className="inline-flex items-center gap-1 rounded-xl bg-brand-blue px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-blue/90 transition"
                  >
                    <Check size={14} /> Lu
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
