import { useCallback, useEffect, useMemo, useState } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { GlassCard } from '../ui/GlassCard'
import { listGroups, type Group } from '../services/groups'
import { useAuthStore } from '../stores/authStore'
import { useRealtimeRefresh } from '../hooks/useRealtimeRefresh'
import { apiError } from '../services/api'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler)

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const [groups, setGroups] = useState<Group[]>([])
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    listGroups()
      .then((g) => {
        setGroups(g)
        setError(null)
      })
      .catch((err) => setError(apiError(err, 'Chargement impossible')))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Rafraîchit le tableau de bord à chaque événement temps réel et au retour de focus.
  useRealtimeRefresh(load)

  const totalContribution = useMemo(
    () => groups.reduce((acc, g) => acc + Number(g.contribution_amount), 0),
    [groups],
  )

  const chartData = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
    datasets: [
      {
        label: 'Cotisations (CFA)',
        data: [12000, 19000, 15000, 25000, 22000, totalContribution || 30000],
        borderColor: '#0D47A1',
        backgroundColor: 'rgba(13,71,161,0.12)',
        fill: true,
        tension: 0.4,
      },
    ],
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Bonjour{user?.fullName ? `, ${user.fullName}` : ''} 👋
          </h1>
          <p className="mt-2 text-sm text-slate-600">Vue d’ensemble de votre activité.</p>
        </div>

        {error && <div className="mt-4 rounded-xl bg-red-50 ring-1 ring-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <GlassCard title="Total cotisations" value={`${totalContribution.toLocaleString()} CFA`} />
          <GlassCard title="Tontines actives" value={String(groups.filter((g) => g.status === 'active').length)} />
          <GlassCard title="Mes groupes" value={String(groups.length)} accent="orange" />
          <GlassCard title="Cycle moyen" value={String(groups.length ? Math.round(groups.reduce((a, g) => a + g.current_cycle, 0) / groups.length) : 0)} />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl glass ring-1 ring-white/20 p-5 sm:p-6">
            <div className="text-sm font-semibold text-slate-900">Évolution des cotisations</div>
            <div className="mt-4">
              <Line data={chartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
            </div>
          </div>
          <div className="rounded-2xl glass ring-1 ring-white/20 p-5 sm:p-6">
            <div className="text-sm font-semibold text-slate-900">Mes groupes</div>
            <div className="mt-4 space-y-3">
              {groups.slice(0, 4).map((g) => (
                <div key={g.id} className="rounded-xl bg-white/50 ring-1 ring-slate-200/60 p-3">
                  <div className="text-sm font-medium text-slate-900">{g.name}</div>
                  <div className="text-xs text-slate-600 mt-1">{Number(g.contribution_amount).toLocaleString()} CFA · {g.frequency}</div>
                </div>
              ))}
              {groups.length === 0 && <p className="text-sm text-slate-600">Aucun groupe.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
