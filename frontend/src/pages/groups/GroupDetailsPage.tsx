export default function GroupDetailsPage() {
  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="rounded-2xl glass ring-1 ring-white/20 p-5 sm:p-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Détails du groupe</h1>
          <p className="mt-2 text-sm text-slate-600">Table des membres, historique, planning, paramètres et discussion.</p>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="rounded-xl bg-white/50 ring-1 ring-slate-200/60 p-4">
                <div className="text-sm font-semibold text-slate-900">Membres</div>
                <div className="mt-3 h-48 rounded-lg bg-slate-100" />
              </div>
            </div>
            <div>
              <div className="rounded-xl bg-white/50 ring-1 ring-slate-200/60 p-4">
                <div className="text-sm font-semibold text-slate-900">Historique cotisations</div>
                <div className="mt-3 h-48 rounded-lg bg-slate-100" />
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-white/40 ring-1 ring-slate-200/60 p-4">
            <div className="text-sm font-semibold text-slate-900">Discussion / Chat (UI placeholder)</div>
            <div className="mt-3 h-56 rounded-lg bg-slate-100" />
          </div>
        </div>
      </div>
    </div>
  )
}

