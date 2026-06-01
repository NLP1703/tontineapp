import { useEffect, useMemo, useState } from 'react'
import { Wallet } from 'lucide-react'
import { GlassCard } from '../ui/GlassCard'
import { listGroups, getHistory, type Payment } from '../services/groups'
import { apiError } from '../services/api'

interface PaymentRow extends Payment {
  groupName: string
}

export default function PaymentsPage() {
  const [rows, setRows] = useState<PaymentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const groups = await listGroups()
        const histories = await Promise.all(
          groups.map(async (g) => {
            const payments = await getHistory(g.id).catch(() => [] as Payment[])
            return payments.map((p) => ({ ...p, groupName: g.name }))
          }),
        )
        const all = histories.flat().sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
        setRows(all)
      } catch (err) {
        setError(apiError(err, 'Chargement des paiements impossible'))
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const total = useMemo(() => rows.reduce((acc, p) => acc + Number(p.amount), 0), [rows])
  const lateCount = useMemo(() => rows.filter((p) => p.days_late > 0).length, [rows])

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Paiements</h1>
            <p className="mt-2 text-sm text-slate-600">Historique de vos cotisations, tous groupes confondus.</p>
          </div>
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-blue to-brand-orange text-white ring-1 ring-white/30">
            <Wallet size={22} />
          </span>
        </div>

        {error && <div className="mt-4 rounded-xl bg-red-50 ring-1 ring-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <GlassCard title="Total versé" value={`${total.toLocaleString()} CFA`} />
          <GlassCard title="Nombre de paiements" value={String(rows.length)} accent="orange" />
          <GlassCard title="Paiements en retard" value={String(lateCount)} />
        </div>

        <div className="mt-6 rounded-2xl glass ring-1 ring-white/20 p-4 sm:p-6 shadow-soft overflow-x-auto">
          {loading ? (
            <p className="text-sm text-slate-600">Chargement…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-slate-600">Aucun paiement enregistré.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-2 pr-4 font-medium">Date</th>
                  <th className="py-2 pr-4 font-medium">Membre</th>
                  <th className="py-2 pr-4 font-medium">Groupe</th>
                  <th className="py-2 pr-4 font-medium">Rubrique</th>
                  <th className="py-2 pr-4 font-medium">Montant</th>
                  <th className="py-2 pr-4 font-medium">Émetteur → Récepteur</th>
                  <th className="py-2 pr-4 font-medium">Statut</th>
                  <th className="py-2 font-medium">Retard</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className="border-t border-slate-200/60">
                    <td className="py-2 pr-4 text-slate-600">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td className="py-2 pr-4 font-medium text-slate-900">{p.full_name ?? p.user_id.slice(0, 8)}</td>
                    <td className="py-2 pr-4 text-slate-900">{p.groupName}</td>
                    <td className="py-2 pr-4 text-brand-blue">{p.rubric ?? '—'}</td>
                    <td className="py-2 pr-4 text-slate-900">{Number(p.amount).toLocaleString()} CFA</td>
                    <td className="py-2 pr-4 text-xs text-slate-500">{(p.sender_phone ?? '—') + ' → ' + (p.receiver_phone ?? '—')}</td>
                    <td className="py-2 pr-4">
                      <span
                        className={
                          'rounded-full px-2 py-0.5 text-xs font-medium ' +
                          (p.status === 'paid' || p.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700')
                        }
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-2 text-slate-600">{p.days_late > 0 ? `${p.days_late} j` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
