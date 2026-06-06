import { useEffect, useState } from 'react'
import { Check, Crown, Sparkles, Gift, Loader2, Smartphone, X } from 'lucide-react'
import {
  getPlans,
  getCurrentSubscription,
  changePlan,
  checkoutPlan,
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
  // Modal de paiement (simulation Mobile Money) pour les plans payants.
  const [checkoutTarget, setCheckoutTarget] = useState<Plan | null>(null)
  const [phone, setPhone] = useState('')
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getPlans(), getCurrentSubscription()])
      .then(([allPlans, current]) => {
        setPlans(allPlans)
        setCurrentPlan(current.plan.id)
      })
      .catch((err) => setError(apiError(err, 'Abonnements indisponibles')))
      .finally(() => setLoading(false))
  }, [])

  async function onChoose(plan: Plan) {
    if (plan.id === currentPlan || saving) return
    setError(null)
    setSuccess(null)
    // Plan payant : on passe par la simulation de paiement Mobile Money.
    if (plan.priceFcfa > 0) {
      setPayError(null)
      setPhone('')
      setCheckoutTarget(plan)
      return
    }
    // Plan gratuit (downgrade) : application directe, sans paiement.
    setSaving(plan.id)
    try {
      const res = await changePlan(plan.id)
      setCurrentPlan(res.plan.id)
      setSuccess(`Votre abonnement est maintenant : ${res.plan.label}.`)
    } catch (err) {
      setError(apiError(err, 'Le changement de plan a échoué'))
    } finally {
      setSaving(null)
    }
  }

  // Confirme le paiement simulé puis active le plan payant.
  async function onConfirmPayment(e: React.FormEvent) {
    e.preventDefault()
    if (!checkoutTarget || paying) return
    setPaying(true)
    setPayError(null)
    try {
      // Petit délai pour matérialiser le « traitement » du paiement Mobile Money.
      await new Promise((r) => setTimeout(r, 1200))
      const res = await checkoutPlan(checkoutTarget.id, phone.trim())
      setCurrentPlan(res.plan.id)
      setSuccess(
        `Paiement de ${res.payment.amountFcfa.toLocaleString('fr-FR')} FCFA confirmé (réf. ${res.payment.reference}). Abonnement ${res.plan.label} activé.`,
      )
      setCheckoutTarget(null)
    } catch (err) {
      setPayError(apiError(err, 'Le paiement a échoué'))
    } finally {
      setPaying(false)
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
                    onClick={() => onChoose(plan)}
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

        {checkoutTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="w-full max-w-md rounded-2xl glass ring-1 ring-white/30 shadow-soft p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
                  <Smartphone size={20} className="text-brand-orange" /> Paiement Mobile Money
                </div>
                <button
                  type="button"
                  onClick={() => !paying && setCheckoutTarget(null)}
                  aria-label="Fermer"
                  className="text-slate-400 hover:text-slate-700 transition"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="mt-1 text-sm text-slate-600">
                Abonnement <span className="font-semibold">{checkoutTarget.label}</span> —{' '}
                <span className="font-semibold">{checkoutTarget.priceFcfa.toLocaleString('fr-FR')} FCFA/mois</span>
              </p>
              <p className="mt-1 inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                Simulation — aucun paiement réel n'est effectué
              </p>

              <form onSubmit={onConfirmPayment} className="mt-4 space-y-3">
                <div>
                  <label className="text-sm font-medium text-slate-700">Numéro Mobile Money</label>
                  <input
                    className="mt-1 w-full rounded-xl bg-white/70 ring-1 ring-slate-200/70 px-4 py-2"
                    type="tel"
                    placeholder="ex. 6XX XXX XXX"
                    required
                    minLength={6}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={paying}
                  />
                </div>

                {payError && (
                  <div className="rounded-xl bg-red-50 ring-1 ring-red-200 px-4 py-2.5 text-sm text-red-700">{payError}</div>
                )}

                <button
                  type="submit"
                  disabled={paying}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-orange px-4 py-2.5 text-sm font-semibold text-white hover:opacity-95 transition disabled:opacity-60"
                >
                  {paying && <Loader2 className="animate-spin" size={16} />}
                  {paying ? 'Paiement en cours…' : `Payer ${checkoutTarget.priceFcfa.toLocaleString('fr-FR')} FCFA`}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
