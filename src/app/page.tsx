import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import HeroSearchBar from "@/components/HeroSearchBar";
import PWAInstallButton from "@/components/PWAInstallButton";
import { getJeuxBySlugs } from "@/lib/jeux-repository";
import { createServiceClient } from "@/utils/supabase/service";

export const metadata: Metadata = {
  title: "Lokidia Games — Encyclopédie des jeux de société",
  description: "L'encyclopédie française des jeux de société — gratuit, sans pub, fait par des passionnés.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Lokidia Games — Encyclopédie des jeux de société",
    description: "L'encyclopédie française des jeux de société — gratuit, sans pub, fait par des passionnés.",
    url: "/",
    locale: "fr_FR",
    type: "website",
  },
};

const SLUGS_COUPS_DE_COEUR = ["pandemic", "wingspan", "carcassonne"];

const INTENTIONS = [
  { icone: "👫", titre: "À 2", sousTitre: "Duo, couple, face-à-face",  href: "/jeux?filtre=%C3%80+2",              bg: "bg-amber-50  border-amber-200  hover:border-amber-400  hover:shadow-amber-100" },
  { icone: "👨‍👩‍👧", titre: "Famille", sousTitre: "Simple, accessible, convivial",   href: "/jeux?filtre=Familial",              bg: "bg-orange-50 border-orange-200 hover:border-orange-400 hover:shadow-orange-100" },
  { icone: "🎉", titre: "Amis 5+", sousTitre: "Ambiance et grandes tablées",    href: "/jeux?filtre=Entre+amis+(5%2B)",     bg: "bg-red-50    border-red-200    hover:border-red-400    hover:shadow-red-100"    },
  { icone: "⚡", titre: "Rapide",  sousTitre: "Moins de 30 minutes",           href: "/jeux?filtre=Ap%C3%A9ro+(<%2015+min)", bg: "bg-green-50  border-green-200  hover:border-green-400  hover:shadow-green-100"  },
  { icone: "🧠", titre: "Expert",  sousTitre: "Stratégie et profondeur",       href: "/jeux?filtre=Top+Expert",            bg: "bg-blue-50   border-blue-200   hover:border-blue-400   hover:shadow-blue-100"   },
  { icone: "🎁", titre: "Cadeau",  sousTitre: "Valeurs sûres à offrir",        href: "/jeux?filtre=Id%C3%A9es+cadeaux",    bg: "bg-violet-50 border-violet-200 hover:border-violet-400 hover:shadow-violet-100" },
];

const QUICK_FILTERS = [
  { icone: "👫", label: "2 joueurs",  href: "/jeux?filtre=%C3%80+2" },
  { icone: "⏱️", label: "30 min",     href: "/jeux?filtre=Ap%C3%A9ro+(<%2015+min)" },
  { icone: "🧒", label: "Enfants",    href: "/jeux?filtre=Pour+enfants" },
  { icone: "🤝", label: "Coopératif", href: "/jeux?filtre=Coop%C3%A9ratif" },
  { icone: "♟️", label: "Stratégie",  href: "/jeux?filtre=Strat%C3%A9gie" },
];

const PRIX = [
  { prix: "Spiel des Jahres", jeu: "Cascadia",  annee: "2023", description: "Placement de tuiles, objectifs clairs et parties très accessibles." },
  { prix: "As d'Or",          jeu: "Harmonies", annee: "2024", description: "Paysages à construire, choix tactiques et rythme familial."         },
  { prix: "Prix Urus",        jeu: "Faraway",   annee: "2024", description: "Cartes, planification inverse et excellente rejouabilité."           },
];

async function getJeuxCount(): Promise<number> {
  try {
    const sb = createServiceClient();
    const { count } = await sb.from("jeux").select("*", { count: "exact", head: true }).eq("actif", true);
    return count ?? 0;
  } catch {
    return 107;
  }
}

export default async function Home() {
  const [coupsDeCoeur, jeuxCount] = await Promise.all([
    getJeuxBySlugs(SLUGS_COUPS_DE_COEUR),
    getJeuxCount(),
  ]);

  const STATS = [
    { icone: "🎲", value: String(jeuxCount), label: "jeux actifs",        accent: "text-amber-700",  ring: "ring-amber-200",  bg: "bg-amber-50"  },
    { icone: "🏪", value: "4",               label: "boutiques comparées", accent: "text-emerald-700", ring: "ring-emerald-200", bg: "bg-emerald-50" },
    { icone: "⚡", value: "5 min",           label: "pour choisir",        accent: "text-blue-700",   ring: "ring-blue-200",   bg: "bg-blue-50"   },
    { icone: "✨", value: "Gratuit",         label: "accès libre",         accent: "text-violet-700", ring: "ring-violet-200", bg: "bg-violet-50" },
  ];

  return (
    <div className="flex flex-col bg-white">

      {/* ── Hero ── */}
      <section className="relative bg-gradient-to-br from-amber-800 to-amber-900 overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          <span className="float-a absolute text-7xl top-[8%]  left-[4%]">🎲</span>
          <span className="float-b absolute text-5xl top-[18%] right-[7%]">♟️</span>
          <span className="float-c absolute text-6xl bottom-[20%] left-[10%]">🃏</span>
          <span className="float-a absolute text-4xl top-[52%] right-[14%]">🎯</span>
          <span className="float-b absolute text-5xl bottom-[10%] right-[4%]">🎰</span>
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-amber-600/20 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full bg-orange-700/20 blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 py-14 md:py-20 text-center flex flex-col items-center gap-6">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-amber-200 text-xs font-semibold px-4 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {jeuxCount} jeux analysés et comparés
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-white leading-tight tracking-tight">
            Trouvez votre prochain jeu<br />
            <span className="text-amber-300">de société préféré</span>
          </h1>

          <p className="text-base text-amber-200/80 max-w-lg">
            L&apos;encyclopédie française des jeux de société — gratuit, sans pub, fait par des passionnés.
          </p>

          <HeroSearchBar />

          <div className="flex flex-wrap justify-center gap-2 pt-1">
            {QUICK_FILTERS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-semibold text-amber-100 hover:bg-white/20 transition-colors flex items-center gap-1.5"
              >
                <span>{item.icone}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="border-b border-amber-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          {STATS.map((s) => (
            <div key={s.label} className={`rounded-xl ${s.bg} ring-1 ${s.ring} px-4 py-4 flex items-center gap-3`}>
              <span className="text-2xl shrink-0">{s.icone}</span>
              <div>
                <p className={`text-2xl font-black ${s.accent}`}>{s.value}</p>
                <p className="text-xs font-semibold text-gray-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Intentions ── */}
      <section className="bg-amber-50 py-12 md:py-16 border-b border-amber-100">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-7">
            <div>
              <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">Départ rapide</p>
              <h2 className="text-3xl font-black text-amber-950">Je cherche un jeu pour…</h2>
            </div>
            <Link href="/jeux" className="text-sm font-semibold text-amber-700 hover:text-amber-900 transition-colors">
              Explorer tout le catalogue →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {INTENTIONS.map((item) => (
              <Link
                key={item.titre}
                href={item.href}
                className={`group rounded-xl border ${item.bg} p-5 shadow-sm hover:shadow-md transition-all`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-4xl shrink-0">{item.icone}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-black text-gray-900">{item.titre}</h3>
                    <p className="mt-0.5 text-sm text-gray-600">{item.sousTitre}</p>
                  </div>
                  <span className="text-gray-400 group-hover:translate-x-0.5 transition-transform shrink-0" aria-hidden="true">→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Coups de cœur ── */}
      <section className="bg-white py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-7">
            <div>
              <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">Sélection Lokidia</p>
              <h2 className="text-3xl font-black text-amber-950">Valeurs sûres pour commencer</h2>
            </div>
            <Link href="/jeux" className="text-sm font-semibold text-amber-700 hover:text-amber-900 transition-colors">
              Voir tous les jeux →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {coupsDeCoeur.map((jeu) => (
              <Link
                key={jeu.slug}
                href={`/jeu/${jeu.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                {/* Image */}
                <div className="relative h-48 bg-amber-100 overflow-hidden">
                  <Image
                    src={jeu.imageUrl || `https://placehold.co/480x192?text=${encodeURIComponent(jeu.nom)}`}
                    alt={jeu.nom}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    unoptimized={!jeu.imageUrl || jeu.imageUrl.startsWith("/")}
                  />
                  {/* Note badge */}
                  {jeu.note > 0 && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-amber-500 text-white text-xs font-black px-2.5 py-1 rounded-full shadow">
                      ⭐ {jeu.note}/10
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="flex flex-col flex-1 p-4 gap-3">
                  <h3 className="text-lg font-black text-gray-900 group-hover:text-amber-700 transition-colors leading-tight">
                    {jeu.nom}
                  </h3>

                  {/* Catégories */}
                  {(jeu.categoryLinks?.length ?? 0) > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {jeu.categoryLinks!.slice(0, 3).map((c) => (
                        <span key={c.slug} className="bg-amber-100 text-amber-800 text-xs font-medium px-2 py-0.5 rounded-full">
                          {c.nom}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Méta */}
                  <div className="flex gap-2 text-xs text-gray-500">
                    <span className="bg-gray-100 px-2 py-1 rounded-md">{jeu.joueursMin}–{jeu.joueursMax} joueurs</span>
                    <span className="bg-gray-100 px-2 py-1 rounded-md">{jeu.dureeMin}–{jeu.dureeMax} min</span>
                    <span className="bg-gray-100 px-2 py-1 rounded-md">{jeu.ageMin}+ ans</span>
                  </div>

                  {/* CTA */}
                  <div className="mt-auto pt-1">
                    <span className="inline-flex items-center gap-1.5 text-sm font-bold text-amber-700 group-hover:gap-2.5 transition-all">
                      Voir le jeu <span aria-hidden="true">→</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── PWA / Scanner ── */}
      <section className="bg-amber-900 py-12 md:py-16 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-10 items-center">

          {/* Texte */}
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-xs font-bold text-amber-300 uppercase tracking-widest mb-2">Application mobile</p>
              <h2 className="text-3xl font-black text-white leading-tight">
                📱 Lokidia dans<br />votre poche
              </h2>
            </div>
            <p className="text-amber-200/80 leading-relaxed">
              Installez l&apos;app gratuitement et scannez n&apos;importe quelle boîte de jeu pour accéder instantanément à sa fiche, ses règles et les meilleurs prix.
            </p>
            <ul className="flex flex-col gap-3">
              {[
                "📷 Scanner un jeu en 2 secondes",
                "📚 Gérez votre ludothèque",
                "❤️ Partagez votre wishlist avec vos amis",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-amber-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <PWAInstallButton className="self-start inline-flex items-center gap-2 bg-white text-amber-900 font-bold px-5 py-2.5 rounded-xl hover:bg-amber-50 transition-colors shadow-lg text-sm" />
          </div>

          {/* Mockup téléphone */}
          <div className="flex justify-center md:justify-end">
            <PhoneMockup />
          </div>

        </div>
      </section>

      {/* ── Pourquoi Lokidia ── */}
      <section className="bg-amber-50 py-12 md:py-16 border-y border-amber-100">
        <div className="max-w-6xl mx-auto px-4 grid lg:grid-cols-[0.9fr_1.1fr] gap-10 items-start">
          <div>
            <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">Pourquoi Lokidia</p>
            <h2 className="text-3xl font-black text-amber-950">Moins d&apos;hésitation, plus de parties.</h2>
            <p className="mt-4 text-gray-600 leading-relaxed">
              L&apos;accueil vous aide à passer vite d&apos;une envie vague à quelques jeux pertinents, avec les infos qui comptent vraiment.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <Feature icone="📖" title="Règles résumées"  text="Comprendre le principe avant d'ouvrir la boîte." />
            <Feature icone="💰" title="Prix comparés"    text="Repérez vite la meilleure offre parmi 4 boutiques." />
            <Feature icone="❤️" title="Profils et listes" text="Gardez vos envies, parties et favoris au même endroit." />
          </div>
        </div>
      </section>

      {/* ── Récompensés ── */}
      <section className="bg-amber-950 py-12 md:py-16 text-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-7">
            <div>
              <p className="text-xs font-bold text-amber-300 uppercase tracking-widest mb-1">Récompenses</p>
              <h2 className="text-3xl font-black">Jeux repérés par la critique</h2>
            </div>
            <Link href="/jeux" className="text-sm font-semibold text-amber-200 hover:text-white transition-colors">
              Rechercher un lauréat →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PRIX.map((item) => (
              <Link
                key={item.prix}
                href={`/jeux?q=${encodeURIComponent(item.jeu)}`}
                className="group rounded-xl border border-white/10 bg-white/5 p-5 hover:bg-white/10 hover:border-white/20 transition-all"
              >
                <p className="text-xs font-bold text-amber-400 uppercase tracking-wide">{item.prix} · {item.annee}</p>
                <h3 className="mt-2 text-2xl font-black group-hover:text-amber-300 transition-colors">{item.jeu}</h3>
                <p className="mt-3 text-sm leading-relaxed text-amber-100/70">{item.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}

function Feature({ icone, title, text }: { icone: string; title: string; text: string }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-white p-4 shadow-sm">
      <div className="text-2xl mb-2">{icone}</div>
      <h3 className="font-black text-amber-950">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{text}</p>
    </div>
  );
}

function PhoneMockup() {
  return (
    <svg
      viewBox="0 0 220 420"
      className="w-48 md:w-56 drop-shadow-2xl"
      aria-hidden="true"
    >
      {/* Phone body */}
      <rect x="10" y="4" width="200" height="412" rx="32" fill="#1c1917" />
      <rect x="14" y="8" width="192" height="404" rx="29" fill="#292524" />

      {/* Screen */}
      <rect x="18" y="12" width="184" height="396" rx="26" fill="#0c0a09" />

      {/* Notch */}
      <rect x="72" y="12" width="76" height="20" rx="10" fill="#1c1917" />

      {/* Status bar dots */}
      <circle cx="90" cy="22" r="3" fill="#78716c" />
      <circle cx="130" cy="22" r="3" fill="#78716c" />

      {/* App header */}
      <rect x="18" y="32" width="184" height="44" rx="0" fill="#1c0a00" />
      <text x="110" y="59" textAnchor="middle" fill="#fbbf24" fontSize="13" fontWeight="bold" fontFamily="system-ui">🎲 Lokidia Scanner</text>

      {/* Camera viewfinder area */}
      <rect x="18" y="76" width="184" height="200" fill="#111827" />

      {/* Corner marks — top left */}
      <path d="M54 106 L54 96 L64 96" stroke="#f59e0b" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Corner marks — top right */}
      <path d="M166 106 L166 96 L156 96" stroke="#f59e0b" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Corner marks — bottom left */}
      <path d="M54 246 L54 256 L64 256" stroke="#f59e0b" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Corner marks — bottom right */}
      <path d="M166 246 L166 256 L156 256" stroke="#f59e0b" strokeWidth="3" fill="none" strokeLinecap="round" />

      {/* Barcode lines */}
      <rect x="72" y="145" width="3"  height="60" rx="1" fill="#374151" opacity="0.8" />
      <rect x="79" y="145" width="6"  height="60" rx="1" fill="#374151" opacity="0.8" />
      <rect x="89" y="145" width="2"  height="60" rx="1" fill="#374151" opacity="0.8" />
      <rect x="95" y="145" width="5"  height="60" rx="1" fill="#374151" opacity="0.8" />
      <rect x="104" y="145" width="3" height="60" rx="1" fill="#374151" opacity="0.8" />
      <rect x="111" y="145" width="7" height="60" rx="1" fill="#374151" opacity="0.8" />
      <rect x="122" y="145" width="2" height="60" rx="1" fill="#374151" opacity="0.8" />
      <rect x="128" y="145" width="4" height="60" rx="1" fill="#374151" opacity="0.8" />
      <rect x="136" y="145" width="6" height="60" rx="1" fill="#374151" opacity="0.8" />
      <rect x="146" y="145" width="3" height="60" rx="1" fill="#374151" opacity="0.8" />

      {/* Scan line */}
      <rect x="40" y="175" width="140" height="2" rx="1" fill="#f59e0b" opacity="0.9" />

      {/* Scan label */}
      <text x="110" y="272" textAnchor="middle" fill="#9ca3af" fontSize="10" fontFamily="system-ui">Pointez vers le code-barres</text>

      {/* Result card area */}
      <rect x="24" y="284" width="172" height="88" rx="12" fill="#1c1917" />
      <rect x="32" y="294" width="40" height="40" rx="8" fill="#292524" />
      <text x="52" y="319" textAnchor="middle" fontSize="20">🎲</text>
      <rect x="80" y="298" width="80" height="8" rx="4" fill="#f59e0b" opacity="0.8" />
      <rect x="80" y="312" width="60" height="6" rx="3" fill="#57534e" />
      <rect x="80" y="324" width="70" height="6" rx="3" fill="#57534e" opacity="0.6" />
      <rect x="32" y="342" width="156" height="22" rx="8" fill="#b45309" />
      <text x="110" y="357" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="system-ui">Voir la fiche →</text>

      {/* Home indicator */}
      <rect x="80" y="400" width="60" height="4" rx="2" fill="#44403c" />
    </svg>
  );
}
