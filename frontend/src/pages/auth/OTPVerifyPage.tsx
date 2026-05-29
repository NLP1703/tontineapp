export default function OTPVerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl glass ring-1 ring-white/20 p-6 sm:p-8 shadow-soft">
        <h1 className="text-2xl font-bold text-slate-900">Vérification OTP</h1>
        <p className="mt-2 text-sm text-slate-600">Entrez le code reçu par email/SMS.</p>

        <form className="mt-6 space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="text-sm font-medium text-slate-700">Code OTP</label>
            <input
              className="mt-1 w-full rounded-xl bg-white/60 ring-1 ring-slate-200/70 px-4 py-3 outline-none focus:ring-brand-blue/40"
              type="text"
              inputMode="numeric"
              required
              placeholder="123456"
            />
          </div>

          <button className="w-full rounded-xl bg-brand-blue px-4 py-3 text-white font-semibold hover:bg-brand-blue/90 transition" type="submit">
            Valider
          </button>
          <div className="text-sm text-slate-600">
            <a className="hover:text-brand-blue" href="/login">Retour connexion</a>
          </div>
        </form>
      </div>
    </div>
  )
}

