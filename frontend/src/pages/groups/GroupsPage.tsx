import { GlassCard } from '../../ui/GlassCard'

const groups = [
  { id: '1', name: 'Tontine Harmonie', members: 12, contribution: 50000, frequency: 'Mensuelle', progress: 65, nextBeneficiary: 'Samuel' },
  { id: '2', name: 'Espoir Plus', members: 9, contribution: 35000, frequency: 'Bi-mensuelle', progress: 41, nextBeneficiary: 'Aminata' },
  { id: '3', name: 'Cercle Croissance', members: 15, contribution: 25000, frequency: 'Mensuelle', progress: 78, nextBeneficiary: 'Joseph' },
]

export default function GroupsPage() {
  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Groupes de tontine</h1>
            <p className="mt-2 text-sm text-slate-600">Recherchez, rejoignez et gérez vos groupes.</p>
          </div>
          <div className="flex gap-2">
            <button className="rounded-xl bg-white/60 glass ring-1 ring-white/20 px-4 py-2 font-semibold text-slate-800 hover:bg-white/80 transition" type="button">
              Rejoindre
            </button>
            <button className="rounded-xl bg-brand-blue px-4 py-2 font-semibold text-white hover:bg-brand-blue/90 transition" type="button">
              Créer un groupe
            </button>
          </div>
        </div>

        <div className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((g) => (
              <GlassCard
                key={g.id}
                title={g.name}
                value={`${g.members} membres`}
                custom={
                  <>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="rounded-xl bg-white/40 ring-1 ring-slate-200/60 p-3">
                        <div className="text-xs text-slate-600">Cotisation</div>
                        <div className="text-sm font-semibold text-slate-900">{g.contribution.toLocaleString()} CFA</div>
                      </div>
                      <div className="rounded-xl bg-white/40 ring-1 ring-slate-200/60 p-3">
                        <div className="text-xs text-slate-600">Fréquence</div>
                        <div className="text-sm font-semibold text-slate-900">{g.frequency}</div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <span>Progression</span>
                        <span className="font-semibold text-slate-900">{g.progress}%</span>
                      </div>
                      <div className="mt-2 h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                        <div className="h-full w-[65%] rounded-full bg-gradient-to-r from-brand-blue to-brand-orange" style={{ width: `${g.progress}%` }} />
                      </div>
                    </div>

                    <div className="mt-3 text-xs text-slate-600">
                      Prochain bénéficiaire : <span className="font-semibold text-slate-900">{g.nextBeneficiary}</span>
                    </div>

                    <div className="mt-4">
                      <a className="inline-flex w-full justify-center rounded-xl bg-brand-blue px-4 py-2 text-white font-semibold hover:bg-brand-blue/90 transition" href={`/groups/${g.id}`}>
                        Voir le groupe
                      </a>
                    </div>
                  </>
                }
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

