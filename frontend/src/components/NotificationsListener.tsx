import { useEffect, useState } from 'react'
import { io, type Socket } from 'socket.io-client'
import { Bell, X } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useRealtimeStore } from '../stores/realtimeStore'

interface LiveNotif {
  id: number
  title: string
  body: string
}

// Connexion Socket.io temps réel : affiche un toast à chaque notification reçue.
// La gateway Nginx proxifie /socket.io/ vers le notification-service.
// Base vide par défaut => même origine (jamais de fallback localhost absolu).
const NOTIFY_URL = import.meta.env.VITE_NOTIFY_URL || ''

export default function NotificationsListener() {
  const token = useAuthStore((s) => s.token)
  const [toasts, setToasts] = useState<LiveNotif[]>([])

  useEffect(() => {
    if (!token) return
    // URL vide => même origine (cas Docker derrière la gateway).
    const socket: Socket = io(NOTIFY_URL || undefined, {
      auth: { token },
      transports: ['websocket', 'polling'],
    })

    socket.on('notification', (payload: { title: string; body: string }) => {
      const id = Date.now() + Math.random()
      setToasts((prev) => [...prev, { id, title: payload.title, body: payload.body }])
      // Signale l'événement au store realtime : les pages abonnées (dashboard,
      // notifications…) se rafraîchissent automatiquement.
      useRealtimeStore.getState().bump({ title: payload.title, body: payload.body })
      // Disparaît automatiquement au bout de 8 s.
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 8000)
    })

    return () => {
      socket.disconnect()
    }
  }, [token])

  function dismiss(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-20 sm:bottom-4 right-4 z-50 flex flex-col gap-2 w-80 max-w-[90vw]">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="rounded-2xl glass ring-1 ring-white/30 shadow-soft p-4 flex items-start gap-3"
        >
          <span className="mt-0.5 text-brand-orange"><Bell size={18} /></span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-slate-900">{t.title}</div>
            <div className="text-sm text-slate-600 mt-0.5">{t.body}</div>
          </div>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            aria-label="Fermer"
            className="text-slate-400 hover:text-slate-700 transition"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  )
}
