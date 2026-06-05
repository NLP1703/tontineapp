import {
  Users,
  Wallet,
  RefreshCw,
  Bell,
  BarChart3,
  Sparkles,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'

// Services proposés par la plateforme, illustrés par une photo professionnelle.
// Chaque carte garde un dégradé de marque + icône en repli si l'image ne charge pas
// (rendu toujours soigné, même hors-ligne ou si l'URL casse).
interface Service {
  title: string
  desc: string
  icon: LucideIcon
  img: string
  alt: string
}

const IMG = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=600&q=70`

const services: Service[] = [
  {
    title: 'Groupes de tontine',
    desc: 'Créez et gérez vos groupes en ligne, membres et rôles inclus.',
    icon: Users,
    img: IMG('photo-1543269865-cbf427effbad'),
    alt: 'Groupe de personnes collaborant',
  },
  {
    title: 'Cotisations & Mobile Money',
    desc: 'Enregistrez les cotisations et suivez chaque paiement.',
    icon: Wallet,
    img: IMG('photo-1556742502-ec7c0e9f34b1'),
    alt: 'Paiement mobile',
  },
  {
    title: 'Rotation automatisée',
    desc: 'Le tour des bénéficiaires calculé et suivi sans litige.',
    icon: RefreshCw,
    img: IMG('photo-1554224155-6726b3ff858f'),
    alt: 'Planification financière',
  },
  {
    title: 'Notifications temps réel',
    desc: 'Rappels et alertes pour éviter les retards de cotisation.',
    icon: Bell,
    img: IMG('photo-1556656793-08538906a9f8'),
    alt: 'Notification sur smartphone',
  },
  {
    title: 'Tableau de bord analytique',
    desc: 'Visualisez cagnottes, historiques et tendances en un coup d’œil.',
    icon: BarChart3,
    img: IMG('photo-1551288049-bebda4e38f71'),
    alt: 'Tableau de bord analytique',
  },
  {
    title: 'Score de fiabilité (IA)',
    desc: 'Un score prédictif recommande l’ordre de rotation optimal.',
    icon: Sparkles,
    img: IMG('photo-1639762681485-074b7f938ba0'),
    alt: 'Intelligence artificielle et données',
  },
  {
    title: 'Sécurité & traçabilité',
    desc: 'Chaque transaction est tracée, authentifiée et sécurisée.',
    icon: ShieldCheck,
    img: IMG('photo-1563986768609-322da13575f3'),
    alt: 'Sécurité numérique',
  },
]

function ServiceCard({ s }: { s: Service }) {
  const Icon = s.icon
  return (
    <article className="w-72 sm:w-80 shrink-0 rounded-[1.5rem] glass ring-1 ring-white/20 overflow-hidden shadow-soft">
      <div className="relative h-44 bg-gradient-to-br from-brand-blue to-brand-orange flex items-center justify-center">
        {/* Repli (toujours présent derrière l'image) */}
        <Icon className="text-white/90" size={44} />
        <img
          src={s.img}
          alt={s.alt}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.opacity = '0'
          }}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <span className="absolute left-3 bottom-3 inline-flex items-center gap-2 rounded-xl bg-white/85 px-2.5 py-1 text-xs font-semibold text-slate-800 ring-1 ring-white/40">
          <Icon size={14} className="text-brand-blue" />
          {s.title}
        </span>
      </div>
      <div className="p-5">
        <h3 className="text-base font-semibold text-slate-900">{s.title}</h3>
        <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{s.desc}</p>
      </div>
    </article>
  )
}

export default function ServicesMarquee() {
  // La liste est dupliquée : quand le défilement atteint -50%, la boucle est continue.
  const loop = [...services, ...services]

  return (
    <section id="services" className="py-14">
      <style>{`
        @keyframes tontine-marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-slate-900">Nos services</h2>
        <p className="mt-2 text-slate-600">
          Tout ce que la plateforme met à votre disposition pour gérer une tontine moderne.
        </p>
      </div>

      <div
        className="mt-10 overflow-hidden"
        style={{
          maskImage:
            'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
          WebkitMaskImage:
            'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
        }}
      >
        <div
          className="flex w-max gap-5 px-4 hover:[animation-play-state:paused] motion-reduce:animate-none"
          style={{ animation: 'tontine-marquee 40s linear infinite' }}
        >
          {loop.map((s, i) => (
            <ServiceCard key={`${s.title}-${i}`} s={s} />
          ))}
        </div>
      </div>
    </section>
  )
}
