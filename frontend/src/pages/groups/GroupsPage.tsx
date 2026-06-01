import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { GlassCard } from '../../ui/GlassCard'
import { createGroup, listGroups, type Group } from '../../services/groups'
import { apiError } from '../../services/api'

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [frequency, setFrequency] = useState('monthly')
  // Jour récurrent de cotisation (jour du mois si mensuel, jour de semaine sinon).
  const [paymentDay, setPaymentDay] = useState('')
  // Rubriques disponibles à la création (montant par rubrique).
  const [rubrics, setRubrics] = useState<Record<string, { enabled: boolean; amount: string }>>({
    SECOURS: { enabled: false, amount: '' },
    COLLATION: { enabled: false, amount: '' },
    EPARGNE: { enabled: false, amount: '' },
  })

  function toggleRubric(key: string) {
    setRubrics((r) => ({ ...r, [key]: { ...r[key], enabled: !r[key].enabled } }))
  }
  function setRubricAmount(key: string, value: string) {
    setRubrics((r) => ({ ...r, [key]: { ...r[key], amount: value } }))
  }

  async function load() {
    setLoading(true)
    try {
      setGroups(await listGroups())
      setError(null)
    } catch (err) {
      setError(apiError(err, 'Impossible de charger les groupes'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function onCreate(e: React.FormEvent) {
    e.preventDefault()
    try {
      const selectedRubrics = Object.entries(rubrics)
        .filter(([, v]) => v.enabled)
        .map(([name, v]) => ({ name, amount: Number(v.amount) || 0 }))
      await createGroup({
        name,
        contributionAmount: Number(amount) || 0,
        frequency,
        paymentDay: paymentDay ? Number(paymentDay) : null,
        rubrics: selectedRubrics,
      })
      setName('')
      setAmount('')
      setPaymentDay('')
      setRubrics({
        SECOURS: { enabled: false, amount: '' },
        COLLATION: { enabled: false, amount: '' },
        EPARGNE: { enabled: false, amount: '' },
      })
      setShowForm(false)
      await load()
    } catch (err) {
      setError(apiError(err, 'Création impossible'))
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Groupes de tontine</h1>
            <p className="mt-2 text-sm text-slate-600">Recherchez, rejoignez et gérez vos groupes.</p>
          </div>
          <button
            className="rounded-xl bg-brand-blue px-4 py-2 font-semibold text-white hover:bg-brand-blue/90 transition"
            type="button"
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? 'Annuler' : 'Créer un groupe'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={onCreate} className="mt-4 rounded-2xl glass ring-1 ring-white/20 p-4 grid gap-3 sm:grid-cols-4">
            <input className="rounded-xl bg-white/60 ring-1 ring-slate-200/70 px-3 py-2 sm:col-span-2" placeholder="Nom du groupe" required value={name} onChange={(e) => setName(e.target.value)} />
            <input className="rounded-xl bg-white/60 ring-1 ring-slate-200/70 px-3 py-2" type="number" placeholder="Cotisation (CFA)" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <select aria-label="Fréquence de cotisation" className="rounded-xl bg-white/60 ring-1 ring-slate-200/70 px-3 py-2" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
              <option value="monthly">Mensuelle</option>
              <option value="biweekly">Bi-mensuelle</option>
              <option value="weekly">Hebdomadaire</option>
            </select>
            <div className="sm:col-span-4">
              <label className="text-sm font-medium text-slate-700">Jour de paiement des cotisations</label>
              <p className="text-xs text-slate-500 mb-2">
                {frequency === 'monthly'
                  ? 'Jour du mois où la cotisation est attendue (1 à 28).'
                  : 'Jour de la semaine où la cotisation est attendue.'}
              </p>
              {frequency === 'monthly' ? (
                <input
                  className="w-full sm:w-48 rounded-xl bg-white/60 ring-1 ring-slate-200/70 px-3 py-2"
                  type="number"
                  min="1"
                  max="28"
                  placeholder="ex. 5"
                  value={paymentDay}
                  onChange={(e) => setPaymentDay(e.target.value)}
                />
              ) : (
                <select
                  aria-label="Jour de paiement"
                  className="w-full sm:w-48 rounded-xl bg-white/60 ring-1 ring-slate-200/70 px-3 py-2"
                  value={paymentDay}
                  onChange={(e) => setPaymentDay(e.target.value)}
                >
                  <option value="">— Choisir —</option>
                  <option value="1">Lundi</option>
                  <option value="2">Mardi</option>
                  <option value="3">Mercredi</option>
                  <option value="4">Jeudi</option>
                  <option value="5">Vendredi</option>
                  <option value="6">Samedi</option>
                  <option value="7">Dimanche</option>
                </select>
              )}
            </div>
            <div className="sm:col-span-4">
              <div className="text-sm font-medium text-slate-700">Rubriques de cotisation</div>
              <p className="text-xs text-slate-500 mb-2">Choisissez les rubriques du groupe et leur montant.</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {Object.entries(rubrics).map(([key, v]) => (
                  <div
                    key={key}
                    className={
                      'rounded-xl ring-1 p-3 transition ' +
                      (v.enabled ? 'bg-brand-blue/10 ring-brand-blue/40' : 'bg-white/50 ring-slate-200/70')
                    }
                  >
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
                      <input type="checkbox" checked={v.enabled} onChange={() => toggleRubric(key)} />
                      {key}
                    </label>
                    {v.enabled && (
                      <input
                        className="mt-2 w-full rounded-lg bg-white/70 ring-1 ring-slate-200/70 px-2 py-1 text-sm"
                        type="number"
                        min="0"
                        placeholder="Montant (CFA)"
                        value={v.amount}
                        onChange={(e) => setRubricAmount(key, e.target.value)}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <button className="rounded-xl bg-brand-orange px-4 py-2 font-semibold text-white sm:col-span-4" type="submit">Enregistrer</button>
          </form>
        )}

        {error && <div className="mt-4 rounded-xl bg-red-50 ring-1 ring-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="mt-6">
          {loading ? (
            <p className="text-sm text-slate-600">Chargement…</p>
          ) : groups.length === 0 ? (
            <p className="text-sm text-slate-600">Aucun groupe pour le moment. Créez votre premier groupe.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {groups.map((g) => (
                <GlassCard
                  key={g.id}
                  title={g.name}
                  value={`Cycle ${g.current_cycle}`}
                  custom={
                    <>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div className="rounded-xl bg-white/40 ring-1 ring-slate-200/60 p-3">
                          <div className="text-xs text-slate-600">Cotisation</div>
                          <div className="text-sm font-semibold text-slate-900">{Number(g.contribution_amount).toLocaleString()} CFA</div>
                        </div>
                        <div className="rounded-xl bg-white/40 ring-1 ring-slate-200/60 p-3">
                          <div className="text-xs text-slate-600">Fréquence</div>
                          <div className="text-sm font-semibold text-slate-900">{g.frequency}</div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <Link className="inline-flex w-full justify-center rounded-xl bg-brand-blue px-4 py-2 text-white font-semibold hover:bg-brand-blue/90 transition" to={`/groups/${g.id}`}>
                          Voir le groupe
                        </Link>
                      </div>
                    </>
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
