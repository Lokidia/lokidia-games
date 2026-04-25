import type { Metadata } from "next";
import Link from "next/link";
import HeroSearchBar from "@/components/HeroSearchBar";
import CarteJeuFeatured from "@/components/CarteJeuFeatured";
import { getJeuxBySlugs } from "@/lib/jeux-repository";
import { createServiceClient } from "@/utils/supabase/service";

export const metadata: Metadata = {
  title: "Lokidia Games — Encyclopédie des jeux de société",
  description: "Trouvez votre prochain jeu de société : fiches détaillées, règles résumées, comparateur de prix Amazon / Philibert / Cultura et recommandations personnalisées.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Lokidia Games — Encyclopédie des jeux de société",
    description: "Fiches détaillées, règles résumées, comparateur de prix et recommandations pour choisir votre jeu de société.",
    url: "/",
    locale: "fr_FR",
    type: "website",
  },
};

const SLUGS_COUPS_DE_COEUR = ["pandemic", "wingspan", "carcassonne"];

/* ─── Données statiques des sections ─── */

const PAR_ENVIE = [
  { emoji: "👫", titre: "Jouer à 2",          sousTitre: "Jeux pour duo",               href: "/jeux?filtre=%C3%80+2" },
  { emoji: "👨‍👩‍👧‍👦", titre: "Soirée famille",    sousTitre: "Dès 7 ans, fun garanti",      href: "/jeux?filtre=Familial" },
  { emoji: "🎉", titre: "Entre amis (5+)",    sousTitre: "Pour les grandes tablées",     href: "/jeux?filtre=Entre+amis+(5%2B)" },
  { emoji: "⚡", titre: "Partie rapide",       sousTitre: "Moins de 30 minutes",         href: "/jeux?filtre=Ap%C3%A9ro+(<%2015+min)" },
  { emoji: "🧠", titre: "Pour experts",        sousTitre: "Stratégie & complexité",       href: "/jeux?filtre=Top+Expert" },
  { emoji: "🎁", titre: "Idée cadeau",         sousTitre: "Le jeu parfait à offrir",      href: "/jeux?filtre=Id%C3%A9es+cadeaux" },
];

const PRIX = [
  {
    prix: "Spiel des Jahres",
    icone: "🏆",
    couleur: "from-yellow-500 to-amber-500",
    texte: "or",
    jeu: "Cascadia",
    annee: "2023",
    description: "Un jeu de placement de tuiles dans des paysages naturels du Pacifique Nord-Ouest.",
  },
  {
    prix: "As d'Or",
    icone: "🥇",
    couleur: "from-amber-500 to-orange-500",
    texte: "fr",
    jeu: "Harmonies",
    annee: "2024",
    description: "Construisez des paysages harmonieux en plaçant des animaux et des arbres avec soin.",
  },
  {
    prix: "Prix Urus",
    icone: "🎖️",
    couleur: "from-orange-600 to-red-500",
    texte: "be",
    jeu: "Faraway",
    annee: "2024",
    description: "Explorez un continent mystérieux dans ce jeu de cartes aux mécaniques inversées.",
  },
];

async function getJeuxCount(): Promise<number> {
  try {
    const sb = createServiceClient();
    const { count } = await sb
      .from("jeux")
      .select("*", { count: "exact", head: true })
      .eq("actif", true);
    return count ?? 0;
  } catch {
    return 107;
  }
}

/* ─── Page ─── */

export default async function Home() {
  const [coupsDeCoeur, jeuxCount] = await Promise.all([
    getJeuxBySlugs(SLUGS_COUPS_DE_COEUR),
    getJeuxCount(),
  ]);

  const STATS = [
    { valeur: String(jeuxCount), label: "Jeux référencés" },
    { valeur: "4",               label: "Boutiques comparées" },
    { valeur: "107+",            label: "jeux" },
    { valeur: "Gratuit",         label: "Accès libre" },
  ];

  return (
    <div className="flex flex-col">

      {/* ════════════════════════════════════════
          SECTION 1 — HERO
      ════════════════════════════════════════ */}
      <section className="relative bg-gradient-to-br from-amber-950 via-amber-900 to-amber-800 overflow-hidden">

        {/* Éléments flottants décoratifs */}
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          <span className="float-a absolute text-7xl top-[10%]  left-[5%]">🎲</span>
          <span className="float-b absolute text-5xl top-[20%]  right-[8%]">♟️</span>
          <span className="float-c absolute text-6xl bottom-[25%] left-[12%]">🃏</span>
          <span className="float-a absolute text-4xl top-[55%]  right-[15%]">🎯</span>
          <span className="float-b absolute text-5xl bottom-[15%] right-[5%]">🎰</span>
          <span className="float-c absolute text-3xl top-[35%]  left-[2%]">🎮</span>
          {/* Cercles lumineux en arrière-plan */}
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-amber-600/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-orange-700/20 blur-3xl" />
        </div>

        {/* Contenu hero */}
        <div className="relative max-w-4xl mx-auto px-4 py-20 md:py-28 text-center flex flex-col items-center gap-8">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-amber-200 text-xs font-semibold px-4 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {jeuxCount} jeux analysés, comparés et expliqués
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight">
            Trouvez votre prochain<br />
            <span className="text-amber-400">jeu de société préféré</span>
          </h1>

          <p className="text-lg text-amber-200/80 max-w-xl">
            Fiches détaillées, règles résumées, comparateur de prix et recommandations personnalisées.
          </p>

          <HeroSearchBar />

          <div className="flex flex-wrap justify-center gap-3 text-sm text-amber-300/70">
            <span>Tendances :</span>
            {["Wingspan", "Terraforming Mars", "Catan", "Azul"].map((nom) => (
              <Link
                key={nom}
                href={`/jeux?q=${encodeURIComponent(nom)}`}
                className="hover:text-amber-300 transition-colors underline underline-offset-2"
              >
                {nom}
              </Link>
            ))}
          </div>
        </div>

        {/* Stats band */}
        <div className="border-t border-white/10 bg-black/20 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto px-4 py-4 grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/10">
            {STATS.map(({ valeur, label }) => (
              <div key={label} className="flex flex-col items-center py-2 px-4">
                <span className="text-2xl font-black text-amber-400">{valeur}</span>
                <span className="text-xs text-amber-200/60 mt-0.5">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          SECTION 2 — COUPS DE CŒUR
      ════════════════════════════════════════ */}
      <section className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">Sélection Lokidia</p>
              <h2 className="text-3xl font-black text-amber-950">Nos coups de cœur 💛</h2>
            </div>
            <Link href="/jeux" className="text-sm font-semibold text-amber-700 hover:text-amber-900 transition-colors flex items-center gap-1">
              Voir tout
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="flex flex-col gap-4">
            {coupsDeCoeur.map((jeu) => (
              <CarteJeuFeatured key={jeu.slug} jeu={jeu} />
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          SECTION 3 — PAR ENVIE
      ════════════════════════════════════════ */}
      <section className="bg-amber-50 py-16 border-y border-amber-100">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">Trouvez par usage</p>
            <h2 className="text-3xl font-black text-amber-950">Je cherche un jeu pour…</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {PAR_ENVIE.map(({ emoji, titre, sousTitre, href }) => (
              <Link
                key={titre}
                href={href}
                className="group bg-white rounded-2xl p-5 flex flex-col items-center text-center gap-2 shadow-sm border border-amber-100 hover:border-amber-400 hover:shadow-lg hover:-translate-y-1 transition-all"
              >
                <span className="text-4xl group-hover:scale-110 transition-transform">{emoji}</span>
                <span className="font-bold text-sm text-amber-900 leading-tight">{titre}</span>
                <span className="text-xs text-gray-500 leading-tight">{sousTitre}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          SECTION 4 — LES PRIMÉS
      ════════════════════════════════════════ */}
      <section className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">Reconnus par la critique</p>
            <h2 className="text-3xl font-black text-amber-950">Récompensés par la critique</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {PRIX.map(({ prix, icone, couleur, jeu, annee, description }) => (
              <div key={prix} className="bg-white rounded-2xl shadow-md border border-amber-100 overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1">
                {/* En-tête coloré */}
                <div className={`bg-gradient-to-r ${couleur} p-5 flex items-center gap-3`}>
                  <span className="text-3xl">{icone}</span>
                  <div>
                    <p className="text-white font-black text-lg leading-tight">{prix}</p>
                    <p className="text-white/70 text-xs font-medium uppercase tracking-wide">{annee}</p>
                  </div>
                </div>

                {/* Contenu */}
                <div className="p-5">
                  <Link
                    href={`/jeux?q=${encodeURIComponent(jeu)}`}
                    className="text-xl font-bold text-amber-900 hover:text-amber-700 transition-colors block mb-2"
                  >
                    {jeu}
                  </Link>
                  <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
                  <Link
                    href={`/jeux?q=${encodeURIComponent(jeu)}`}
                    className="inline-flex items-center gap-1 mt-4 text-xs font-semibold text-amber-700 hover:text-amber-900 transition-colors"
                  >
                    Voir la fiche
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
