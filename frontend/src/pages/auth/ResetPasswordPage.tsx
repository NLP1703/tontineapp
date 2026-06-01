import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../../services/auth'
import { apiError } from '../../services/api'
import { useAuthStore } from '../../stores/authStore'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const setSession = useAuthStore((s) => s.setSession)
  const [email, setEmail] = useState(params.get('email') ?? '')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError('Les deux mots de passe ne correspondent pas.')
      return
    }
    setLoading(true)
    try {
      const { token, user } = await resetPassword(email, otp, password)
      setSession(token, user)
      navigate('/dashboard')
    } catch (err) {
      setError(apiError(err, 'OTP invalide ou expiré'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl glass ring-1 ring-white/20 p-6 sm:p-8 shadow-soft">
        <h1 className="text-2xl font-bold text-slate-900">Nouveau mot de passe</h1>
        <p className="mt-2 text-sm text-slate-600">Saisissez le code à 6 chiffres reçu par email, puis votre nouveau mot de passe.</p>

        {error && <div className="mt-4 rounded-xl bg-red-50 ring-1 ring-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              className="mt-1 w-full rounded-xl bg-white/60 ring-1 ring-slate-200/70 px-4 py-3 outline-none focus:ring-brand-blue/40"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemple.com"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Code OTP</label>
            <input
              className="mt-1 w-full rounded-xl bg-white/60 ring-1 ring-slate-200/70 px-4 py-3 outline-none focus:ring-brand-blue/40"
              type="text"
              inputMode="numeric"
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Nouveau mot de passe</label>
            <input
              className="mt-1 w-full rounded-xl bg-white/60 ring-1 ring-slate-200/70 px-4 py-3 outline-none focus:ring-brand-blue/40"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="•••••••• (min. 8)"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Confirmer le mot de passe</label>
            <input
              className="mt-1 w-full rounded-xl bg-white/60 ring-1 ring-slate-200/70 px-4 py-3 outline-none focus:ring-brand-blue/40"
              type="password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            className="w-full rounded-xl bg-brand-blue px-4 py-3 text-white font-semibold hover:bg-brand-blue/90 transition disabled:opacity-60"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Enregistrement…' : 'Réinitialiser le mot de passe'}
          </button>
          <div className="text-sm text-slate-600">
            <Link className="hover:text-brand-blue" to="/login">Retour connexion</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
