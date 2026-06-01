import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { forgotPassword } from '../../services/auth'
import { apiError } from '../../services/api'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [info, setInfo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)
    try {
      const res = await forgotPassword(email)
      // En dev, l'API renvoie debugOtp (pas d'email réel).
      const hint = res.debugOtp ? ` (OTP dev : ${res.debugOtp})` : ''
      setInfo(`Si ce compte existe, un OTP a été envoyé.${hint}`)
      setTimeout(() => navigate(`/reset-password?email=${encodeURIComponent(email)}`), 1200)
    } catch (err) {
      setError(apiError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl glass ring-1 ring-white/20 p-6 sm:p-8 shadow-soft">
        <h1 className="text-2xl font-bold text-slate-900">Mot de passe oublié</h1>
        <p className="mt-2 text-sm text-slate-600">Saisissez votre email pour recevoir un OTP.</p>

        {info && <div className="mt-4 rounded-xl bg-emerald-50 ring-1 ring-emerald-200 px-4 py-3 text-sm text-emerald-700">{info}</div>}
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

          <button
            className="w-full rounded-xl bg-brand-orange px-4 py-3 text-white font-semibold hover:opacity-95 transition disabled:opacity-60"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Envoi…' : 'Envoyer OTP'}
          </button>
          <div className="text-sm text-slate-600">
            <Link className="hover:text-brand-blue" to="/login">Retour connexion</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
