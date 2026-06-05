import { motion } from 'framer-motion'
import { ArrowRight, Check } from 'lucide-react'
import ServicesMarquee from '../components/ServicesMarquee'

const stats = [
  { label: 'Tontines gérées', value: 1284 },
  { label: 'Cagnotte totale', value: 482000 },
  { label: 'Paiements sécurisés', value: 39211 },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <header className="sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mt-4 flex items-center justify-between rounded-2xl glass px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-brand-blue/20 ring-1 ring-brand-blue/30 flex items-center justify-center">
                <span className="font-bold text-brand-blue">T</span>
              </div>
              <div className="leading-tight">
                <div className="text-sm text-slate-600">TontineApp</div>
                <div className="text-base font-semibold">Plateforme digitale</div>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
              <a className="hover:text-slate-900" href="#services">Services</a>
              <a className="hover:text-slate-900" href="#features">Fonctionnalités</a>
              <a className="hover:text-slate-900" href="#testimonials">Témoignages</a>
              <a className="hover:text-slate-900" href="#pricing">Avantages</a>
            </nav>

            <div className="flex items-center gap-2">
              <a
                href="/login"
                className="hidden sm:inline-flex items-center rounded-xl px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white/50 glass"
              >
                Connexion
              </a>
              <a
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-blue px-4 py-2 text-sm font-semibold text-white shadow-soft hover:bg-brand-blue/90 transition"
              >
                Commencer
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 py-14 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-blue/10 ring-1 ring-brand-blue/20 px-3 py-1 text-sm text-brand-blue">
              <span className="h-2 w-2 rounded-full bg-brand-orange" />
              Fintech premium pour l’épargne rotative
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900">
              Gérez vos tontines en toute transparence.
            </h1>
            <p className="text-slate-600 text-lg leading-relaxed">
              Suivez les cotisations, automatisez la rotation des bénéficiaires et recevez des rappels intelligents —
              le tout avec un design moderne inspiré des apps bancaires.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-blue px-6 py-3 text-white font-semibold shadow-soft hover:bg-brand-blue/90 transition"
              >
                Démarrer maintenant
                <ArrowRight className="h-5 w-5" />
              </a>
              <a
                href="#features"
                className="inline-flex items-center justify-center rounded-xl bg-white/60 glass px-6 py-3 text-slate-800 font-semibold ring-1 ring-slate-200 hover:bg-white/80 transition"
              >
                Voir les fonctionnalités
              </a>
            </div>

            <ul className="grid gap-3 sm:grid-cols-2">
              {[
                'Transparence en temps réel',
                'Alertes & rappels automatisés',
                'Tableau de bord analytics',
                'Sécurité et suivi complet',
              ].map((t) => (
                <li key={t} className="flex items-start gap-3 text-slate-700">
                  <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-xl bg-brand-orange/15 ring-1 ring-brand-orange/25">
                    <Check className="h-4 w-4 text-brand-orange" />
                  </span>
                  <span className="text-sm font-medium">{t}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative"
          >
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-r from-brand-blue/20 via-brand-orange/10 to-brand-blue/20 blur-2xl" />
            <div className="relative rounded-[2rem] glass p-5 sm:p-7 shadow-soft ring-1 ring-white/20">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-900">Aperçu Dashboard</div>
                <div className="rounded-full bg-brand-blue/10 ring-1 ring-brand-blue/25 px-3 py-1 text-xs font-semibold text-brand-blue">
                  Live
                </div>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {stats.map((s) => (
                  <div key={s.label} className="rounded-2xl bg-white/50 ring-1 ring-slate-200/60 p-4">
                    <div className="text-2xl font-bold text-slate-900">{s.value.toLocaleString()}</div>
                    <div className="mt-1 text-xs text-slate-600">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl bg-white/40 ring-1 ring-slate-200/60 p-4">
                <div className="text-xs font-semibold text-slate-700">Rotation en cours</div>
                <div className="mt-3 h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full w-[65%] rounded-full bg-gradient-to-r from-brand-blue to-brand-orange" />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                  <span>Prochain bénéficiaire</span>
                  <span className="font-semibold text-slate-900">Semaine 3</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Stats strip */}
        <div className="grid gap-4 sm:grid-cols-3 pb-12">
          {stats.map((s, idx) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.06 }}
              className="rounded-[1.5rem] glass p-5 ring-1 ring-white/20"
            >
              <div className="text-3xl font-bold text-slate-900">{s.value.toLocaleString()}</div>
              <div className="mt-2 text-sm text-slate-600 font-medium">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Services (carrousel horizontal défilant) */}
      <ServicesMarquee />

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex items-end justify-between gap-6">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Fonctionnalités pensées pour le quotidien</h2>
            <p className="mt-2 text-slate-600">Tout ce qu’il faut pour piloter une tontine moderne.</p>
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            {
              title: 'Transparence totale',
              desc: 'Cotisations et historiques consultables à tout moment.',
            },
            {
              title: 'Rotation automatisée',
              desc: 'Calcul et suivi du tour de bénéficiaire sans confusion.',
            },
            {
              title: 'Rappels intelligents',
              desc: 'Notifications pour éviter les retards et litiges.',
            },
          ].map((f) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="rounded-[1.5rem] glass p-6 ring-1 ring-white/20"
            >
              <div className="text-lg font-semibold text-slate-900">{f.title}</div>
              <p className="mt-2 text-slate-600 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
        <h2 className="text-3xl font-bold text-slate-900">Ils adoptent TontineApp</h2>
        <p className="mt-2 text-slate-600">Des retours orientés confiance et usage.</p>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            { name: 'Camille', role: 'Membre', quote: 'On voit tout en temps réel. Plus de disputes.' },
            { name: 'Daniel', role: 'Coordinateur', quote: 'Les rappels nous évitent des retards.' },
            { name: 'Fatou', role: 'Investisseuse', quote: 'Interface claire et vraiment professionnelle.' },
          ].map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="rounded-[1.5rem] glass p-6 ring-1 ring-white/20"
            >
              <div className="text-sm font-semibold text-slate-900">{t.name}</div>
              <div className="mt-1 text-xs text-slate-600">{t.role}</div>
              <p className="mt-4 text-slate-700 text-sm leading-relaxed">“{t.quote}”</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section id="pricing" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-24">
        <div className="rounded-[2rem] glass p-6 sm:p-10 ring-1 ring-white/20">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Prêt(e) à gérer votre épargne ?</h2>
              <p className="mt-2 text-slate-600">Créez votre premier groupe en quelques minutes.</p>
            </div>
            <div className="flex flex-col sm:items-end">
              <a
                href="/register"
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-brand-orange px-6 py-3 text-white font-semibold shadow-soft hover:opacity-95 transition"
              >
                Créer mon compte
                <ArrowRight className="h-5 w-5" />
              </a>
              <div className="mt-3 text-xs text-slate-600">
                Aucun engagement. Design premium, sécurité sérieuse.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/70 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="font-bold text-slate-900">TontineApp</div>
            <div className="text-sm text-slate-600">© {new Date().getFullYear()} — Tous droits réservés.</div>
          </div>
          <div className="flex gap-4 text-sm text-slate-600">
            <a className="hover:text-slate-900" href="#features">Fonctionnalités</a>
            <a className="hover:text-slate-900" href="#testimonials">Témoignages</a>
            <a className="hover:text-slate-900" href="/login">Connexion</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

