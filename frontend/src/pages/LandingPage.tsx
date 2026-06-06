import { motion } from 'framer-motion'
import {
  ArrowRight,
  Check,
  Eye,
  Repeat,
  BellRing,
  ShieldCheck,
  Sparkles,
  Star,
  UserPlus,
  Wallet,
  TrendingUp,
  Quote,
} from 'lucide-react'
import ServicesMarquee from '../components/ServicesMarquee'

const stats = [
  { label: 'Tontines gérées', value: '1 284' },
  { label: 'Cagnotte sécurisée', value: '482 000 CFA' },
  { label: 'Paiements traités', value: '39 211' },
]

const features = [
  {
    icon: Eye,
    title: 'Transparence totale',
    desc: 'Cotisations, cagnotte et historiques consultables par tous les membres, à tout moment.',
  },
  {
    icon: Repeat,
    title: 'Rotation automatisée',
    desc: 'Le tour des bénéficiaires est calculé et suivi sans confusion ni litige.',
  },
  {
    icon: BellRing,
    title: 'Rappels intelligents',
    desc: 'Des notifications en temps réel pour éviter les retards et les oublis de cotisation.',
  },
  {
    icon: Sparkles,
    title: 'Score de fiabilité (IA)',
    desc: 'Un score prédictif recommande l’ordre de rotation le plus sûr pour le groupe.',
  },
  {
    icon: TrendingUp,
    title: 'Tableau de bord analytique',
    desc: 'Suivez vos cotisations réelles et leurs tendances mois après mois.',
  },
  {
    icon: ShieldCheck,
    title: 'Sécurité & traçabilité',
    desc: 'Chaque transaction est authentifiée, tracée et conservée de façon fiable.',
  },
]

const steps = [
  {
    icon: UserPlus,
    title: 'Créez votre groupe',
    desc: 'Invitez vos membres par email ou téléphone et définissez le montant et la fréquence.',
  },
  {
    icon: Wallet,
    title: 'Enregistrez les cotisations',
    desc: 'Chaque paiement Mobile Money est suivi et visible par tout le groupe en temps réel.',
  },
  {
    icon: Repeat,
    title: 'Laissez tourner',
    desc: 'La rotation et les rappels s’occupent du reste. Chacun reçoit son tour à la bonne date.',
  },
]

const testimonials = [
  { name: 'Camille N.', role: 'Membre', quote: 'On voit tout en temps réel. Plus aucune dispute sur qui a payé.' },
  { name: 'Daniel M.', role: 'Coordinateur', quote: 'Les rappels automatiques nous évitent les retards. Un vrai gain de temps.' },
  { name: 'Fatou D.', role: 'Investisseuse', quote: 'Interface claire et vraiment professionnelle. Je recommande sans hésiter.' },
]

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <header className="sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mt-4 flex items-center justify-between rounded-2xl glass px-4 py-3 shadow-soft">
            <a href="/" className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-brand-blue to-brand-orange ring-1 ring-white/30 flex items-center justify-center">
                <span className="font-bold text-white">T</span>
              </div>
              <div className="leading-tight">
                <div className="text-xs text-slate-500">TontineApp</div>
                <div className="text-base font-semibold text-slate-900">Plateforme digitale</div>
              </div>
            </a>

            <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
              <a className="hover:text-slate-900 transition" href="#services">Services</a>
              <a className="hover:text-slate-900 transition" href="#how">Comment ça marche</a>
              <a className="hover:text-slate-900 transition" href="#features">Fonctionnalités</a>
              <a className="hover:text-slate-900 transition" href="#testimonials">Témoignages</a>
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
              <span className="h-2 w-2 rounded-full bg-brand-orange animate-pulse" />
              Fintech premium pour l’épargne rotative
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-[1.1]">
              Gérez vos tontines en toute{' '}
              <span className="bg-gradient-to-r from-brand-blue to-brand-orange bg-clip-text text-transparent">
                transparence
              </span>
              .
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
                href="#how"
                className="inline-flex items-center justify-center rounded-xl bg-white/60 glass px-6 py-3 text-slate-800 font-semibold ring-1 ring-slate-200 hover:bg-white/80 transition"
              >
                Comment ça marche
              </a>
            </div>

            {/* Preuve sociale */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-1">
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} className="h-4 w-4 fill-brand-orange text-brand-orange" />
                  ))}
                </div>
                <span className="text-sm font-medium text-slate-700">4,9/5 de satisfaction</span>
              </div>
              <div className="text-sm text-slate-600">
                <span className="font-semibold text-slate-900">1 200+</span> groupes actifs
              </div>
            </div>

            <ul className="grid gap-3 sm:grid-cols-2">
              {[
                'Transparence en temps réel',
                'Alertes & rappels automatisés',
                'Tableau de bord analytique',
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
                <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-blue/10 ring-1 ring-brand-blue/25 px-3 py-1 text-xs font-semibold text-brand-blue">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </div>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {stats.slice(0, 2).map((s) => (
                  <div key={s.label} className="rounded-2xl bg-white/50 ring-1 ring-slate-200/60 p-4">
                    <div className="text-2xl font-bold text-slate-900">{s.value}</div>
                    <div className="mt-1 text-xs text-slate-600">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl bg-white/40 ring-1 ring-slate-200/60 p-4">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>Rotation en cours</span>
                  <span className="text-brand-blue">65 %</span>
                </div>
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
              className="rounded-[1.5rem] glass p-5 ring-1 ring-white/20 shadow-soft"
            >
              <div className="text-3xl font-bold text-slate-900">{s.value}</div>
              <div className="mt-2 text-sm text-slate-600 font-medium">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Services (carrousel horizontal défilant) */}
      <ServicesMarquee />

      {/* Comment ça marche */}
      <section id="how" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-2xl">
          <span className="text-sm font-semibold uppercase tracking-wide text-brand-orange">
            En 3 étapes
          </span>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">Comment ça marche</h2>
          <p className="mt-2 text-slate-600">De la création du groupe au versement, tout est guidé.</p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => {
            const Icon = s.icon
            return (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="relative rounded-[1.5rem] glass p-6 ring-1 ring-white/20 shadow-soft"
              >
                <div className="absolute right-5 top-5 text-5xl font-bold text-slate-900/5">
                  {i + 1}
                </div>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-blue to-brand-orange ring-1 ring-white/30">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="mt-4 text-lg font-semibold text-slate-900">{s.title}</div>
                <p className="mt-2 text-slate-600 text-sm leading-relaxed">{s.desc}</p>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-2xl">
          <span className="text-sm font-semibold uppercase tracking-wide text-brand-orange">
            Fonctionnalités
          </span>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">Pensées pour le quotidien</h2>
          <p className="mt-2 text-slate-600">Tout ce qu’il faut pour piloter une tontine moderne.</p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => {
            const Icon = f.icon
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="group rounded-[1.5rem] glass p-6 ring-1 ring-white/20 shadow-soft hover:-translate-y-1 hover:ring-brand-blue/30 transition"
              >
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-blue/10 ring-1 ring-brand-blue/20 text-brand-blue group-hover:bg-brand-blue group-hover:text-white transition">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="mt-4 text-lg font-semibold text-slate-900">{f.title}</div>
                <p className="mt-2 text-slate-600 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-2xl">
          <span className="text-sm font-semibold uppercase tracking-wide text-brand-orange">
            Témoignages
          </span>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">Ils adoptent TontineApp</h2>
          <p className="mt-2 text-slate-600">Des retours orientés confiance et usage.</p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="rounded-[1.5rem] glass p-6 ring-1 ring-white/20 shadow-soft"
            >
              <Quote className="h-7 w-7 text-brand-blue/30" />
              <p className="mt-3 text-slate-700 text-sm leading-relaxed">{t.quote}</p>
              <div className="mt-4 flex">
                {[0, 1, 2, 3, 4].map((s) => (
                  <Star key={s} className="h-4 w-4 fill-brand-orange text-brand-orange" />
                ))}
              </div>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue to-brand-orange text-sm font-bold text-white ring-1 ring-white/30">
                  {initials(t.name)}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{t.name}</div>
                  <div className="text-xs text-slate-600">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section id="pricing" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-24">
        <div className="relative overflow-hidden rounded-[2rem] glass p-6 sm:p-10 ring-1 ring-white/20 shadow-soft">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-orange/15 blur-3xl" />
          <div className="absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-brand-blue/15 blur-3xl" />
          <div className="relative grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Prêt(e) à gérer votre épargne ?</h2>
              <p className="mt-2 text-slate-600">Créez votre premier groupe en quelques minutes, sans engagement.</p>
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
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-blue to-brand-orange ring-1 ring-white/30 flex items-center justify-center">
              <span className="font-bold text-white text-sm">T</span>
            </div>
            <div>
              <div className="font-bold text-slate-900">TontineApp</div>
              <div className="text-sm text-slate-600">© {new Date().getFullYear()} — Tous droits réservés.</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-slate-600">
            <a className="hover:text-slate-900 transition" href="#how">Comment ça marche</a>
            <a className="hover:text-slate-900 transition" href="#features">Fonctionnalités</a>
            <a className="hover:text-slate-900 transition" href="#testimonials">Témoignages</a>
            <a className="hover:text-slate-900 transition" href="/login">Connexion</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
