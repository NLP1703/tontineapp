import { GlassCard } from '../ui/GlassCard'

export default function DashboardPage() {
  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="mt-2 text-sm text-slate-600">Vue d’ensemble de votre activité.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <GlassCard title="Total des cotisations" value="12 480" />
          <GlassCard title="Tontines actives" value="7" />
          <GlassCard title="Paiements à venir" value="3" accent="orange" />
          <GlassCard title="Solde portefeuille" value="5 120" />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl glass ring-1 ring-white/20 p-5 sm:p-6">
            <div className="text-sm font-semibold text-slate-900">Graphique (placeholder)</div>
            <div className="mt-4 h-64 rounded-xl bg-white/50 ring-1 ring-slate-200/60" />
          </div>
          <div className="rounded-2xl glass ring-1 ring-white/20 p-5 sm:p-6">
            <div className="text-sm font-semibold text-slate-900">Activités récentes</div>
            <div className="mt-4 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-xl bg-white/50 ring-1 ring-slate-200/60 p-3">
                  <div className="text-sm font-medium text-slate-900">Paiement enregistré #{i}</div>
                  <div className="text-xs text-slate-600 mt-1">Il y a 5{i} minutes</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

