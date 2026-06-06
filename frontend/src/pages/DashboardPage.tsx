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
import { getDashboardSummary, type DashboardSummary } from '../services/groups'
import { useAuthStore } from '../stores/authStore'
import { useRealtimeRefresh } from '../hooks/useRealtimeRefresh'
import { apiError } from '../services/api'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler)

const EMPTY: DashboardSummary = { groups: [], totalContributed: 0, perGroup: {}, series: [] }

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const [data, setData] = useState<DashboardSummary>(EMPTY)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    getDashboardSummary()
      .then((d) => {
        setData(d)
        setError(null)
      })
      .catch((err) => setError(apiError(err, 'Chargement impossible')))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Rafraîchit le tableau de bord à chaque événement temps réel (nouvelle cotisation,
  // ajout/retrait de membre…) et au retour de focus : les chiffres reflètent le réel.
  useRealtimeRefresh(load)

  const { groups, totalContributed, perGroup, series } = data

  const activeCount = useMemo(
    () => groups.filter((g) => g.status === 'active').length,
    [groups],
  )
  const avgCycle = useMemo(
    () => (groups.length ? Math.round(groups.reduce((a, g) => a + g.current_cycle, 0) / groups.length) : 0),
    [groups],
  )

  const hasContributions = series.some((p) => p.amount > 0)

  const chartData = {
    labels: series.map((p) => p.label),
    datasets: [
      {
        label: 'Cotisations (CFA)',
        data: series.map((p) => p.amount),
        borderColor: '#0D47A1',
        backgroundColor: 'rgba(13,71,161,0.12)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#0D47A1',
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
          <p className="mt-2 text-sm text-slate-600">Vue d’ensemble de votre activité, en temps réel.</p>
        </div>

        {error && <div className="mt-4 rounded-xl bg-red-50 ring-1 ring-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <GlassCard title="Total cotisé" value={`${totalContributed.toLocaleString()} CFA`} />
          <GlassCard title="Tontines actives" value={String(activeCount)} />
          <GlassCard title="Mes groupes" value={String(groups.length)} accent="orange" />
          <GlassCard title="Cycle moyen" value={String(avgCycle)} />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl glass ring-1 ring-white/20 p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-900">Évolution de mes cotisations</div>
              <div className="text-xs text-slate-500">6 derniers mois</div>
            </div>
            <div className="mt-4">
              {hasContributions ? (
                <Line data={chartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
              ) : (
                <div className="flex h-48 items-center justify-center rounded-xl bg-white/40 ring-1 ring-slate-200/60 text-sm text-slate-500">
                  Aucune cotisation enregistrée pour l’instant.
                </div>
              )}
            </div>
          </div>
          <div className="rounded-2xl glass ring-1 ring-white/20 p-5 sm:p-6">
            <div className="text-sm font-semibold text-slate-900">Mes groupes</div>
            <div className="mt-4 space-y-3">
              {groups.slice(0, 5).map((g) => (
                <div key={g.id} className="rounded-xl bg-white/50 ring-1 ring-slate-200/60 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium text-slate-900 truncate">{g.name}</div>
                    {g.status === 'active' && (
                      <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                        actif
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    {(perGroup[g.id] ?? 0).toLocaleString()} CFA cotisés · {g.frequency}
                  </div>
                </div>
              ))}
              {groups.length === 0 && <p className="text-sm text-slate-600">Aucun groupe pour l’instant.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
