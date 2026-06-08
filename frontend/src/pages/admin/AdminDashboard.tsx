import { useCallback, useEffect, useState } from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { GlassCard } from '../../ui/GlassCard'
import { apiError } from '../../services/api'
import * as Admin from '../../services/admin'
import type { UserRole } from '../../services/auth'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const ROLES: UserRole[] = ['member', 'group_admin', 'super_admin']
const PAGE_SIZE = 10

export default function AdminDashboard() {
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  // --- Statistiques & alertes ---
  const [stats, setStats] = useState<Admin.AdminStats | null>(null)
  const [totalUsers, setTotalUsers] = useState(0)
  const [alerts, setAlerts] = useState<{ latePayments: Admin.LatePaymentAlert[]; disputedGroups: Admin.DisputedGroup[] }>({
    latePayments: [],
    disputedGroups: [],
  })

  // --- Utilisateurs ---
  const [users, setUsers] = useState<Admin.AdminUser[]>([])
  const [userTotal, setUserTotal] = useState(0)
  const [userPage, setUserPage] = useState(1)
  const [search, setSearch] = useState('')

  // --- Groupes ---
  const [groups, setGroups] = useState<Admin.AdminGroup[]>([])

  // --- Journal d'audit ---
  const [logs, setLogs] = useState<Admin.AuditLog[]>([])
  const [logTotal, setLogTotal] = useState(0)
  const [logPage, setLogPage] = useState(1)
  const [actionFilter, setActionFilter] = useState('')

  const fail = (err: unknown, msg: string) => setError(apiError(err, msg))
  const flash = (msg: string) => {
    setNotice(msg)
    setTimeout(() => setNotice(null), 3000)
  }

  const loadOverview = useCallback(() => {
    Admin.getStats().then(setStats).catch((e) => fail(e, 'Stats indisponibles'))
    Admin.getUserStats().then((d) => setTotalUsers(d.totalUsers)).catch(() => {})
    Admin.getAlerts().then(setAlerts).catch(() => {})
    Admin.listGroups().then(setGroups).catch((e) => fail(e, 'Groupes indisponibles'))
  }, [])

  const loadUsers = useCallback(() => {
    Admin.listUsers({ page: userPage, pageSize: PAGE_SIZE, search: search || undefined })
      .then((r) => {
        setUsers(r.items)
        setUserTotal(r.total)
      })
      .catch((e) => fail(e, 'Utilisateurs indisponibles'))
  }, [userPage, search])

  const loadLogs = useCallback(() => {
    Admin.listAudit({ page: logPage, pageSize: PAGE_SIZE, action: actionFilter || undefined })
      .then((r) => {
        setLogs(r.items)
        setLogTotal(r.total)
      })
      .catch((e) => fail(e, 'Journal indisponible'))
  }, [logPage, actionFilter])

  useEffect(() => loadOverview(), [loadOverview])
  useEffect(() => loadUsers(), [loadUsers])
  useEffect(() => loadLogs(), [loadLogs])

  // --- Actions utilisateurs ---
  async function onChangeRole(id: string, role: UserRole) {
    try {
      await Admin.setUserRole(id, role)
      flash('Rôle mis à jour')
      loadUsers()
      loadLogs()
    } catch (e) {
      fail(e, 'Échec du changement de rôle')
    }
  }

  async function onDisableUser(id: string) {
    if (!window.confirm('Désactiver ce compte ? L’utilisateur ne pourra plus se connecter.')) return
    try {
      await Admin.disableUser(id)
      flash('Compte désactivé')
      loadUsers()
      loadLogs()
    } catch (e) {
      fail(e, 'Échec de la désactivation')
    }
  }

  // --- Actions groupes ---
  async function onForceRotation(id: string) {
    if (!window.confirm('Forcer le changement de bénéficiaire pour ce groupe ?')) return
    try {
      await Admin.forceRotation(id)
      flash('Rotation forcée')
      loadOverview()
      loadLogs()
    } catch (e) {
      fail(e, 'Échec de la rotation')
    }
  }

  async function onDissolve(id: string) {
    if (!window.confirm('Dissoudre ce groupe ? Cette action est irréversible.')) return
    try {
      await Admin.dissolveGroup(id)
      flash('Groupe dissous')
      loadOverview()
      loadLogs()
    } catch (e) {
      fail(e, 'Échec de la dissolution')
    }
  }

  const weeklyChart = {
    labels: (stats?.weeklySeries ?? []).map((p) => p.label.slice(5)),
    datasets: [
      {
        label: 'Cotisations (CFA)',
        data: (stats?.weeklySeries ?? []).map((p) => p.amount),
        backgroundColor: 'rgba(13,71,161,0.7)',
        borderRadius: 6,
      },
    ],
  }

  const userPages = Math.max(1, Math.ceil(userTotal / PAGE_SIZE))
  const logPages = Math.max(1, Math.ceil(logTotal / PAGE_SIZE))

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Administration 🛡️</h1>
          <p className="mt-2 text-sm text-slate-600">Pilotage global de la plateforme TontineApp.</p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 ring-1 ring-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        {notice && (
          <div className="rounded-xl bg-emerald-50 ring-1 ring-emerald-200 px-4 py-3 text-sm text-emerald-700">{notice}</div>
        )}

        {/* ---------------- Statistiques globales ---------------- */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <GlassCard title="Utilisateurs" value={String(totalUsers)} />
          <GlassCard title="Groupes actifs" value={String(stats?.activeGroups ?? 0)} />
          <GlassCard
            title="Cotisations du mois"
            value={`${(stats?.contributionsThisMonth ?? 0).toLocaleString()} CFA`}
            accent="orange"
          />
          <GlassCard
            title="Taux de retard"
            value={`${Math.round((stats?.lateRate ?? 0) * 100)} %`}
          />
        </div>

        <div className="rounded-2xl glass ring-1 ring-white/20 p-5 sm:p-6">
          <div className="text-sm font-semibold text-slate-900">Cotisations — 7 derniers jours</div>
          <div className="mt-4">
            <Bar data={weeklyChart} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          </div>
        </div>

        {/* ---------------- Gestion des utilisateurs ---------------- */}
        <section className="rounded-2xl glass ring-1 ring-white/20 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-lg font-semibold text-slate-900">Utilisateurs</h2>
            <input
              value={search}
              onChange={(e) => {
                setUserPage(1)
                setSearch(e.target.value)
              }}
              placeholder="Rechercher par nom ou email…"
              className="rounded-xl bg-white/70 ring-1 ring-slate-200 px-3 py-2 text-sm w-full sm:w-72"
            />
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-2 pr-4">Nom</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Rôle</th>
                  <th className="py-2 pr-4">Statut</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-slate-200/60">
                    <td className="py-2 pr-4 font-medium text-slate-900">{u.full_name}</td>
                    <td className="py-2 pr-4 text-slate-600">{u.email}</td>
                    <td className="py-2 pr-4">
                      <select
                        value={u.role}
                        onChange={(e) => onChangeRole(u.id, e.target.value as UserRole)}
                        className="rounded-lg bg-white/70 ring-1 ring-slate-200 px-2 py-1 text-xs"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 pr-4">
                      {u.is_active ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                          actif
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200">
                          désactivé
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-4">
                      <button
                        type="button"
                        onClick={() => onDisableUser(u.id)}
                        disabled={!u.is_active}
                        className="rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-40"
                      >
                        Désactiver
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">
                      Aucun utilisateur.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pager page={userPage} pages={userPages} onChange={setUserPage} />
        </section>

        {/* ---------------- Gestion des groupes ---------------- */}
        <section className="rounded-2xl glass ring-1 ring-white/20 p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900">Groupes</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-2 pr-4">Nom</th>
                  <th className="py-2 pr-4">Propriétaire</th>
                  <th className="py-2 pr-4">Membres</th>
                  <th className="py-2 pr-4">Collecté</th>
                  <th className="py-2 pr-4">Statut</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((g) => (
                  <tr key={g.id} className="border-t border-slate-200/60">
                    <td className="py-2 pr-4 font-medium text-slate-900">{g.name}</td>
                    <td className="py-2 pr-4 text-slate-600">{g.owner_name ?? '—'}</td>
                    <td className="py-2 pr-4">{g.member_count}</td>
                    <td className="py-2 pr-4">{g.total_collected.toLocaleString()} CFA</td>
                    <td className="py-2 pr-4">{g.status}</td>
                    <td className="py-2 pr-4 space-x-2 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onForceRotation(g.id)}
                        className="rounded-lg px-2 py-1 text-xs font-medium text-brand-blue hover:bg-blue-50"
                      >
                        Forcer rotation
                      </button>
                      <button
                        type="button"
                        onClick={() => onDissolve(g.id)}
                        className="rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        Dissoudre
                      </button>
                    </td>
                  </tr>
                ))}
                {groups.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500">
                      Aucun groupe.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ---------------- Alertes actives ---------------- */}
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl glass ring-1 ring-white/20 p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-slate-900">Retards de paiement</h2>
            <div className="mt-4 space-y-2">
              {alerts.latePayments.map((p) => (
                <div key={p.payment_id} className="rounded-xl bg-white/50 ring-1 ring-slate-200/60 p-3 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="font-medium text-slate-900">{p.full_name ?? '—'}</span>
                    <span className="text-red-600 font-semibold">{p.days_late} j de retard</span>
                  </div>
                  <div className="text-xs text-slate-600">
                    {p.tontine_name ?? '—'} · {Number(p.amount).toLocaleString()} CFA
                  </div>
                </div>
              ))}
              {alerts.latePayments.length === 0 && <p className="text-sm text-slate-500">Aucun retard.</p>}
            </div>
          </div>
          <div className="rounded-2xl glass ring-1 ring-white/20 p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-slate-900">Groupes en litige</h2>
            <div className="mt-4 space-y-2">
              {alerts.disputedGroups.map((g) => (
                <div key={g.tontine_id} className="rounded-xl bg-white/50 ring-1 ring-slate-200/60 p-3 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="font-medium text-slate-900">{g.tontine_name ?? '—'}</span>
                    <span className="text-amber-600 font-semibold">{g.count} cotisation(s) en retard</span>
                  </div>
                </div>
              ))}
              {alerts.disputedGroups.length === 0 && <p className="text-sm text-slate-500">Aucun litige.</p>}
            </div>
          </div>
        </section>

        {/* ---------------- Journal d'audit ---------------- */}
        <section className="rounded-2xl glass ring-1 ring-white/20 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-lg font-semibold text-slate-900">Journal d'audit</h2>
            <input
              value={actionFilter}
              onChange={(e) => {
                setLogPage(1)
                setActionFilter(e.target.value)
              }}
              placeholder="Filtrer par action (ex: user.role.update)…"
              className="rounded-xl bg-white/70 ring-1 ring-slate-200 px-3 py-2 text-sm w-full sm:w-80"
            />
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Admin</th>
                  <th className="py-2 pr-4">Action</th>
                  <th className="py-2 pr-4">Cible</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-t border-slate-200/60">
                    <td className="py-2 pr-4 text-slate-600 whitespace-nowrap">
                      {new Date(l.created_at).toLocaleString('fr-FR')}
                    </td>
                    <td className="py-2 pr-4 text-slate-900">{l.admin_name ?? l.admin_id}</td>
                    <td className="py-2 pr-4 font-mono text-xs">{l.action}</td>
                    <td className="py-2 pr-4 text-slate-600">
                      {l.target_type}
                      {l.target_id ? ` · ${l.target_id.slice(0, 8)}…` : ''}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-500">
                      Aucune action enregistrée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pager page={logPage} pages={logPages} onChange={setLogPage} />
        </section>
      </div>
    </div>
  )
}

function Pager({ page, pages, onChange }: { page: number; pages: number; onChange: (p: number) => void }) {
  if (pages <= 1) return null
  return (
    <div className="mt-4 flex items-center justify-end gap-2 text-sm">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="rounded-lg px-3 py-1 ring-1 ring-slate-200 disabled:opacity-40 hover:bg-white/70"
      >
        Précédent
      </button>
      <span className="text-slate-500">
        {page} / {pages}
      </span>
      <button
        type="button"
        disabled={page >= pages}
        onClick={() => onChange(page + 1)}
        className="rounded-lg px-3 py-1 ring-1 ring-slate-200 disabled:opacity-40 hover:bg-white/70"
      >
        Suivant
      </button>
    </div>
  )
}
