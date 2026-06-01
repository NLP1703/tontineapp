import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../../services/auth'
import { apiError } from '../../services/api'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await register(fullName, email, password, phone || undefined)
      // Vérification d'email obligatoire : on envoie un code OTP par email.
      navigate(`/otp?email=${encodeURIComponent(email)}`)
    } catch (err) {
      setError(apiError(err, "Échec de l'inscription"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl glass ring-1 ring-white/20 p-6 sm:p-8 shadow-soft">
        <h1 className="text-2xl font-bold text-slate-900">Inscription</h1>
        <p className="mt-2 text-sm text-slate-600">Créez votre compte TontineApp.</p>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 ring-1 ring-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="text-sm font-medium text-slate-700">Nom</label>
            <input
              className="mt-1 w-full rounded-xl bg-white/60 ring-1 ring-slate-200/70 px-4 py-3 outline-none focus:ring-brand-blue/40"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Votre nom"
            />
          </div>
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
            <label className="text-sm font-medium text-slate-700">Téléphone</label>
            <input
              className="mt-1 w-full rounded-xl bg-white/60 ring-1 ring-slate-200/70 px-4 py-3 outline-none focus:ring-brand-blue/40"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+225 07 00 00 00 00"
            />
            <p className="mt-1 text-xs text-slate-500">Permet d'être ajouté à un groupe par numéro.</p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Mot de passe</label>
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
          <button
            className="w-full rounded-xl bg-brand-blue px-4 py-3 text-white font-semibold hover:bg-brand-blue/90 transition disabled:opacity-60"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Création…' : 'Créer mon compte'}
          </button>
          <div className="text-sm text-slate-600">
            Déjà un compte ? <Link className="hover:text-brand-blue" to="/login">Connexion</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
