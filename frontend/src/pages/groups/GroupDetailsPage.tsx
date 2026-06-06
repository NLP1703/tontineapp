import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { io, type Socket } from 'socket.io-client'
import { UserPlus, Trophy, Trash2, CalendarClock, CheckCircle2, Clock, Wallet, Users } from 'lucide-react'
import {
  addMember,
  removeMember,
  setDeadline,
  setMemberPayoutDate,
  contribute,
  getGroup,
  getHistory,
  getRotation,
  type Group,
  type GroupCapacity,
  type GroupTotals,
  type Member,
  type Payment,
  type Rubric,
} from '../../services/groups'
import { apiError } from '../../services/api'
import { useAuthStore } from '../../stores/authStore'

// Même origine par défaut (la gateway proxifie /socket.io/ vers le notification-service).
const NOTIFY_URL = import.meta.env.VITE_NOTIFY_URL || ''

// Convertit une date ISO (UTC) vers le format attendu par <input type="datetime-local">.
function toLocalInput(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function GroupDetailsPage() {
  const { id = '' } = useParams()
  const currentUserId = useAuthStore((s) => s.user?.id)
  const token = useAuthStore((s) => s.token)
  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [rubrics, setRubrics] = useState<Rubric[]>([])
  const [history, setHistory] = useState<Payment[]>([])
  const [totals, setTotals] = useState<GroupTotals | null>(null)
  const [capacity, setCapacity] = useState<GroupCapacity | null>(null)
  const [nextBeneficiary, setNextBeneficiary] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Cotisation
  const [amount, setAmount] = useState('')
  const [senderPhone, setSenderPhone] = useState('')
  const [receiverPhone, setReceiverPhone] = useState('')
  const [rubric, setRubric] = useState('') // '' | nom de rubrique | '__ALL__'

  const payAll = rubric === '__ALL__'

  // Ajout de membre (créateur uniquement)
  const [identifier, setIdentifier] = useState('')
  const [memberMsg, setMemberMsg] = useState<string | null>(null)

  // Date limite de paiement (créateur uniquement)
  const [deadline, setDeadlineInput] = useState('')
  const [deadlineMsg, setDeadlineMsg] = useState<string | null>(null)

  const isOwner = !!group && group.owner_user_id === currentUserId

  // silent = rafraîchissement temps réel sans afficher le spinner de chargement.
  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) setLoading(true)
      try {
        const [g, rot, hist] = await Promise.all([getGroup(id), getRotation(id), getHistory(id)])
        setGroup(g.group)
        setMembers(g.members)
        setRubrics(g.rubrics)
        setTotals(g.totals)
        setCapacity(g.capacity)
        setNextBeneficiary(rot.nextBeneficiary?.userId ?? null)
        setHistory(hist)
        // Pré-remplit le champ <input datetime-local> (format YYYY-MM-DDTHH:mm).
        setDeadlineInput(g.group.payment_deadline ? toLocalInput(g.group.payment_deadline) : '')
        setError(null)
      } catch (err) {
        if (!opts?.silent) setError(apiError(err, 'Impossible de charger le groupe'))
      } finally {
        if (!opts?.silent) setLoading(false)
      }
    },
    [id],
  )

  useEffect(() => {
    if (id) load()
  }, [id, load])

  // Actualisation temps réel : à chaque notification de cotisation/groupe reçue via
  // Socket.io, on recharge silencieusement les données (cagnotte, statuts de paiement…).
  useEffect(() => {
    if (!id || !token) return
    const socket: Socket = io(NOTIFY_URL || undefined, {
      auth: { token },
      transports: ['websocket', 'polling'],
    })
    socket.on('notification', (payload: { type?: string }) => {
      if (payload?.type === 'payment' || payload?.type === 'group') {
        load({ silent: true })
      }
    })
    return () => {
      socket.disconnect()
    }
  }, [id, token, load])

  // Pré-remplit le montant selon la rubrique choisie (ou le total si « Tout payer »).
  function onSelectRubric(value: string) {
    setRubric(value)
    if (value === '__ALL__') {
      const total = rubrics.reduce((acc, r) => acc + Number(r.amount), 0)
      setAmount(String(total))
      return
    }
    const r = rubrics.find((x) => x.name === value)
    if (r) setAmount(String(Number(r.amount)))
  }

  async function onContribute(e: React.FormEvent) {
    e.preventDefault()
    try {
      await contribute(id, {
        amount: payAll ? undefined : Number(amount) || 0,
        senderPhone,
        receiverPhone,
        rubric: payAll || !rubric ? undefined : rubric,
        payAll,
      })
      setAmount('')
      setSenderPhone('')
      setReceiverPhone('')
      setRubric('')
      await load()
    } catch (err) {
      setError(apiError(err, 'Cotisation impossible'))
    }
  }

  async function onAddMember(e: React.FormEvent) {
    e.preventDefault()
    setMemberMsg(null)
    try {
      const m = await addMember(id, identifier.trim())
      setIdentifier('')
      setMemberMsg(`${m.full_name ?? 'Membre'} ajouté au groupe.`)
      await load()
    } catch (err) {
      setMemberMsg(apiError(err, 'Ajout impossible'))
    }
  }

  async function onRemoveMember(m: Member) {
    if (!confirm(`Retirer ${m.full_name ?? 'ce membre'} du groupe ?`)) return
    try {
      await removeMember(id, m.user_id)
      await load()
    } catch (err) {
      setError(apiError(err, 'Retrait impossible'))
    }
  }

  async function onSetDeadline(e: React.FormEvent) {
    e.preventDefault()
    setDeadlineMsg(null)
    try {
      // datetime-local -> ISO 8601 (UTC) attendu par l'API.
      const iso = deadline ? new Date(deadline).toISOString() : null
      await setDeadline(id, iso)
      setDeadlineMsg(iso ? 'Date limite enregistrée. Les membres ont été notifiés.' : 'Date limite effacée.')
      await load()
    } catch (err) {
      setDeadlineMsg(apiError(err, 'Enregistrement impossible'))
    }
  }

  // Date de bouffe d'un membre (créateur uniquement). '' efface la date.
  async function onSetPayoutDate(m: Member, date: string) {
    try {
      await setMemberPayoutDate(id, m.user_id, date || null)
      await load()
    } catch (err) {
      setError(apiError(err, 'Enregistrement de la date impossible'))
    }
  }

  // Libellé lisible du jour de cotisation récurrent selon la fréquence.
  const WEEKDAYS = ['', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche']
  const paymentDayLabel =
    group?.payment_day == null
      ? null
      : group.frequency === 'monthly'
        ? `le ${group.payment_day} de chaque mois`
        : `chaque ${WEEKDAYS[group.payment_day] ?? ''}`

  // Ordre de passage piloté par la « date de bouffe » : date la plus proche d'abord,
  // les membres sans date en dernier ; à égalité on retombe sur l'ordre de rotation.
  const orderedMembers = [...members].sort((a, b) => {
    const da = a.payout_date ? new Date(a.payout_date).getTime() : null
    const db = b.payout_date ? new Date(b.payout_date).getTime() : null
    if (da !== null && db !== null && da !== db) return da - db
    if (da !== null && db === null) return -1
    if (da === null && db !== null) return 1
    return a.rotation_order - b.rotation_order
  })

  if (loading) return <div className="p-6 text-sm text-slate-600">Chargement…</div>

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* En-tête */}
        <div className="rounded-2xl glass ring-1 ring-white/20 p-5 sm:p-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{group?.name ?? 'Groupe'}</h1>
          <p className="mt-2 text-sm text-slate-600">
            Cotisation : {Number(group?.contribution_amount ?? 0).toLocaleString()} CFA · {group?.frequency} · Cycle {group?.current_cycle}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {paymentDayLabel && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-medium text-brand-blue">
                <CalendarClock size={14} />
                Cotisation : {paymentDayLabel}
              </div>
            )}
            {group?.payment_deadline && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                <CalendarClock size={14} />
                Date limite : {new Date(group.payment_deadline).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}
              </div>
            )}
          </div>

          {rubrics.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {rubrics.map((r) => (
                <span key={r.id} className="rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-medium text-brand-blue">
                  {r.name} · {Number(r.amount).toLocaleString()} CFA
                </span>
              ))}
            </div>
          )}

          {error && <div className="mt-4 rounded-xl bg-red-50 ring-1 ring-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
        </div>

        {/* Cagnotte + participants — visibles par tous les membres, actualisés à chaque cotisation */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl glass ring-1 ring-white/20 p-5 sm:p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Wallet size={18} className="text-brand-orange" /> Cagnotte du groupe
            </div>
            <div className="mt-3 text-3xl font-extrabold text-slate-900">
              {Number(totals?.currentCycle ?? 0).toLocaleString()} <span className="text-lg font-bold text-slate-500">CFA</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Cotisé pour le cycle {group?.current_cycle} · Total cumulé : {Number(totals?.allTime ?? 0).toLocaleString()} CFA
            </p>
          </div>
          <div className="rounded-2xl glass ring-1 ring-white/20 p-5 sm:p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Users size={18} className="text-brand-blue" /> Participants
            </div>
            <div className="mt-3 text-3xl font-extrabold text-slate-900">
              {capacity?.memberCount ?? members.length}
              {capacity?.maxMembers != null && (
                <span className="text-lg font-bold text-slate-500"> / {capacity.maxMembers}</span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {capacity?.maxMembers == null
                ? 'Capacité illimitée (plan Premium).'
                : capacity.memberCount >= capacity.maxMembers
                  ? 'Groupe complet.'
                  : `${capacity.maxMembers - capacity.memberCount} place(s) restante(s).`}
            </p>
          </div>
        </div>

        {/* Ajout de membre — créateur uniquement */}
        {isOwner && (
          <div className="rounded-2xl glass ring-1 ring-white/20 p-5 sm:p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <UserPlus size={18} /> Ajouter un membre
            </div>
            <form onSubmit={onAddMember} className="mt-3 flex flex-col sm:flex-row gap-2">
              <input
                className="rounded-xl bg-white/60 ring-1 ring-slate-200/70 px-4 py-2 flex-1"
                placeholder="Email ou numéro de téléphone"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
              <button className="rounded-xl bg-brand-blue px-5 py-2 font-semibold text-white hover:bg-brand-blue/90 transition" type="submit">
                Ajouter
              </button>
            </form>
            {memberMsg && <p className="mt-2 text-sm text-slate-600">{memberMsg}</p>}
          </div>
        )}

        {/* Date limite de paiement — créateur uniquement */}
        {isOwner && (
          <div className="rounded-2xl glass ring-1 ring-white/20 p-5 sm:p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <CalendarClock size={18} /> Date limite de paiement
            </div>
            <form onSubmit={onSetDeadline} className="mt-3 flex flex-col sm:flex-row gap-2">
              <input
                type="datetime-local"
                aria-label="Date limite de paiement"
                title="Date limite de paiement"
                className="rounded-xl bg-white/60 ring-1 ring-slate-200/70 px-4 py-2 flex-1"
                value={deadline}
                onChange={(e) => setDeadlineInput(e.target.value)}
              />
              <button className="rounded-xl bg-brand-blue px-5 py-2 font-semibold text-white hover:bg-brand-blue/90 transition" type="submit">
                Enregistrer
              </button>
              {deadline && (
                <button
                  type="button"
                  onClick={() => { setDeadlineInput(''); }}
                  className="rounded-xl bg-slate-100 px-5 py-2 font-semibold text-slate-700 hover:bg-slate-200 transition"
                >
                  Effacer
                </button>
              )}
            </form>
            <p className="mt-2 text-xs text-slate-500">Tous les membres seront notifiés. Un rappel sera envoyé à ceux qui n'ont pas encore cotisé.</p>
            {deadlineMsg && <p className="mt-2 text-sm text-slate-600">{deadlineMsg}</p>}
          </div>
        )}

        {/* Cotisation */}
        <div className="rounded-2xl glass ring-1 ring-white/20 p-5 sm:p-6">
          <div className="text-sm font-semibold text-slate-900">Cotiser via la plateforme</div>
          <form onSubmit={onContribute} className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {rubrics.length > 0 && (
              <select
                aria-label="Rubrique"
                className="rounded-xl bg-white/60 ring-1 ring-slate-200/70 px-3 py-2"
                value={rubric}
                onChange={(e) => onSelectRubric(e.target.value)}
                required
              >
                <option value="">Choisir une rubrique…</option>
                {rubrics.map((r) => (
                  <option key={r.id} value={r.name}>
                    {r.name} · {Number(r.amount).toLocaleString()} CFA
                  </option>
                ))}
                <option value="__ALL__">
                  Tout payer (toutes rubriques)
                </option>
              </select>
            )}
            <input
              className="rounded-xl bg-white/60 ring-1 ring-slate-200/70 px-4 py-2 disabled:opacity-70"
              type="number"
              placeholder="Montant (CFA)"
              required
              readOnly={payAll}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <input
              className="rounded-xl bg-white/60 ring-1 ring-slate-200/70 px-4 py-2"
              type="tel"
              placeholder="N° qui dépose (émetteur)"
              required
              value={senderPhone}
              onChange={(e) => setSenderPhone(e.target.value)}
            />
            <input
              className="rounded-xl bg-white/60 ring-1 ring-slate-200/70 px-4 py-2"
              type="tel"
              placeholder="N° qui reçoit (bénéficiaire)"
              required
              value={receiverPhone}
              onChange={(e) => setReceiverPhone(e.target.value)}
            />
            <button className="rounded-xl bg-brand-orange px-5 py-2 font-semibold text-white hover:opacity-95 transition lg:col-span-2" type="submit">
              {payAll ? 'Tout cotiser' : 'Cotiser'}
            </button>
          </form>
          {payAll && (
            <p className="mt-2 text-xs text-brand-blue">
              Une cotisation sera enregistrée pour chaque rubrique (total {Number(amount || 0).toLocaleString()} CFA).
            </p>
          )}
          <p className="mt-2 text-xs text-slate-500">Tous les membres du groupe seront notifiés de votre cotisation.</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {/* Participants dans l'ordre de rotation */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl glass ring-1 ring-white/20 p-5">
              <div className="text-sm font-semibold text-slate-900">Participants — ordre de passage</div>
              <p className="text-xs text-slate-500 mb-3">Ordre dans lequel chacun recevra la cagnotte (selon la date de bouffe).</p>
              <div className="space-y-2">
                {orderedMembers.map((m, index) => {
                  const isNext = m.user_id === nextBeneficiary
                  return (
                    <div
                      key={m.id}
                      className={
                        'flex items-center justify-between rounded-xl ring-1 px-3 py-2.5 text-sm ' +
                        (isNext ? 'bg-brand-blue/10 ring-brand-blue/40' : 'bg-white/60 ring-slate-200/60')
                      }
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-blue text-xs font-bold text-white">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="font-medium text-slate-900 truncate">
                            {m.full_name ?? m.user_id.slice(0, 8)}
                            {m.user_id === currentUserId && <span className="ml-1 text-xs text-slate-500">(vous)</span>}
                          </div>
                          {m.phone && <div className="text-xs text-slate-500">{m.phone}</div>}
                          {m.payout_date && (
                            <div className="text-xs text-brand-blue mt-0.5">
                              Reçoit la cagnotte le {new Date(m.payout_date).toLocaleDateString('fr-FR', { dateStyle: 'long' })}
                            </div>
                          )}
                          {isOwner && (
                            <label className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                              <CalendarClock size={12} />
                              <span className="shrink-0">Date de bouffe :</span>
                              <input
                                type="date"
                                aria-label={`Date de bouffe de ${m.full_name ?? 'ce membre'}`}
                                className="rounded-lg bg-white/70 ring-1 ring-slate-200/70 px-2 py-1 text-xs"
                                value={m.payout_date ? m.payout_date.slice(0, 10) : ''}
                                onChange={(e) => onSetPayoutDate(m, e.target.value)}
                              />
                            </label>
                          )}
                        </div>
                        {isNext && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-brand-blue/15 px-2 py-0.5 text-xs text-brand-blue">
                            <Trophy size={12} /> Prochain
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {m.has_paid ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                            <CheckCircle2 size={12} /> Payé
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                            <Clock size={12} /> Non payé
                          </span>
                        )}
                        <span className="text-slate-600 text-xs">Fiabilité {Number(m.reliability_score).toFixed(0)}%</span>
                        {isOwner && m.user_id !== group?.owner_user_id && (
                          <button
                            type="button"
                            onClick={() => onRemoveMember(m)}
                            aria-label={`Retirer ${m.full_name ?? 'ce membre'}`}
                            title="Retirer du groupe"
                            className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 transition"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
                {members.length === 0 && <p className="text-sm text-slate-600">Aucun membre.</p>}
              </div>
            </div>
          </div>

          {/* Historique */}
          <div>
            <div className="rounded-2xl glass ring-1 ring-white/20 p-5">
              <div className="text-sm font-semibold text-slate-900">Historique cotisations</div>
              <div className="mt-3 space-y-2 max-h-96 overflow-auto">
                {history.map((p) => (
                  <div key={p.id} className="rounded-lg bg-white/60 ring-1 ring-slate-200/60 px-3 py-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-800">
                        {p.full_name ?? p.user_id.slice(0, 8)}
                      </span>
                      <span className={p.status === 'late' ? 'text-red-600' : 'text-emerald-600'}>{p.status}</span>
                    </div>
                    <div className="flex justify-between mt-0.5">
                      <span className="text-slate-700">{Number(p.amount).toLocaleString()} CFA</span>
                      {p.rubric && <span className="text-xs text-brand-blue">{p.rubric}</span>}
                    </div>
                    {(p.sender_phone || p.receiver_phone) && (
                      <div className="text-xs text-slate-500 mt-0.5">
                        {p.sender_phone ?? '—'} → {p.receiver_phone ?? '—'}
                      </div>
                    )}
                    <div className="text-xs text-slate-400">{new Date(p.created_at).toLocaleString()}</div>
                  </div>
                ))}
                {history.length === 0 && <p className="text-sm text-slate-600">Aucune transaction.</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
