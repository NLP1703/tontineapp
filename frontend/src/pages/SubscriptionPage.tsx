import { useEffect, useState } from 'react'
import { Check, Crown, Sparkles, Gift, Loader2 } from 'lucide-react'
import {
  getPlans,
  getCurrentSubscription,
  changePlan,
  type Plan,
  type PlanId,
} from '../services/subscription'
import { apiError } from '../services/api'
import { cn } from '../utils/cn'

// Présentation par plan : icône + accroche + liste d'avantages.
const PLAN_UI: Record<PlanId, { icon: typeof Gift; tagline: string; perks: (p: Plan) => string[] }> = {
  free: {
    icon: Gift,
    tagline: 'Pour démarrer et tester',
    perks: (p) => [`Jusqu'à ${p.maxMembersPerGroup} membres par groupe`, 'Cotisations & rotation', 'Notifications temps réel'],
  },
  standard: {
    icon: Sparkles,
    tagline: 'Pour les groupes familiaux',
    perks: (p) => [`Jusqu'à ${p.maxMembersPerGroup} membres par groupe`, 'Toutes les fonctions Gratuit', 'Idéal associations & familles'],
  },
  premium: {
    icon: Crown,
    tagline: 'Pour les grandes tontines',
    perks: () => ['Membres illimités par groupe', 'Toutes les fonctions Standard', 'Support prioritaire'],
  },
}

function formatPrice(fcfa: number): string {
  return fcfa === 0 ? 'Gratuit' : `${fcfa.toLocaleString('fr-FR')} FCFA/mois`
}

export default function SubscriptionPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [currentPlan, setCurrentPlan] = useState<PlanId | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<PlanId | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getPlans(), getCurrentSubscription()])
      .then(([allPlans, current]) => {
        setPlans(allPlans)
        setCurrentPlan(current.plan.id)
      })
      .catch((err) => setError(apiError(err, 'Abonnements indisponibles')))
      .finally(() => setLoading(false))
  }, [])

  async function onChoose(plan: PlanId) {
    if (plan === currentPlan || saving) return
    setSaving(plan)
    setError(null)
    setSuccess(null)
    try {
      const res = await changePlan(plan)
      setCurrentPlan(res.plan.id)
      setSuccess(`Votre abonnement est maintenant : ${res.plan.label}.`)
    } catch (err) {
      setError(apiError(err, 'Le changement de plan a échoué'))
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Abonnement</h1>
        <p className="mt-2 text-sm text-slate-600">
          Choisissez le plan adapté à la taille de vos groupes de tontine. Le plan détermine le
          nombre de membres autorisés par groupe.
        </p>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 ring-1 ring-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        {success && (
          <div className="mt-4 rounded-xl bg-emerald-50 ring-1 ring-emerald-200 px-4 py-3 text-sm text-emerald-700">{success}</div>
        )}

        {loading ? (
          <div className="mt-10 flex items-center justify-center text-slate-500">
            <Loader2 className="animate-spin" size={22} />
          </div>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => {
              const ui = PLAN_UI[plan.id]
              const Icon = ui.icon
              const isCurrent = plan.id === currentPlan
              const isPremium = plan.id === 'premium'
              return (
                <div
                  key={plan.id}
                  className={cn(
                    'relative rounded-2xl glass ring-1 p-6 shadow-soft flex flex-col',
                    isCurrent ? 'ring-2 ring-brand-blue' : 'ring-white/20',
                  )}
                >
                  {isCurrent && (
                    <span className="absolute -top-3 left-6 rounded-full bg-brand-blue px-3 py-1 text-xs font-semibold text-white">
                      Plan actuel
                    </span>
                  )}

                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'h-11 w-11 rounded-2xl flex items-center justify-center text-white ring-1 ring-white/30 bg-gradient-to-br',
                        isPremium ? 'from-brand-orange to-brand-blue' : 'from-brand-blue to-brand-orange',
                      )}
                    >
                      <Icon size={22} />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-slate-900">{plan.label}</div>
                      <div className="text-xs text-slate-500">{ui.tagline}</div>
                    </div>
                  </div>

                  <div className="mt-4 text-2xl font-extrabold text-slate-900">{formatPrice(plan.priceFcfa)}</div>

                  <ul className="mt-4 space-y-2 flex-1">
                    {ui.perks(plan).map((perk) => (
                      <li key={perk} className="flex items-start gap-2 text-sm text-slate-700">
                        <Check size={16} className="mt-0.5 text-emerald-600 shrink-0" />
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    disabled={isCurrent || saving !== null}
                    onClick={() => onChoose(plan.id)}
                    className={cn(
                      'mt-6 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition',
                      isCurrent
                        ? 'bg-slate-100 text-slate-400 cursor-default'
                        : 'bg-brand-blue text-white hover:bg-brand-blue/90 disabled:opacity-60',
                    )}
                  >
                    {saving === plan.id && <Loader2 className="animate-spin" size={16} />}
                    {isCurrent ? 'Abonnement en cours' : 'Choisir ce plan'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
