import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import HeroSearchBar from "@/components/HeroSearchBar";
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

const INTENTIONS = [
  { titre: "À 2", sousTitre: "Duo, couple, face-à-face", href: "/jeux?filtre=%C3%80+2" },
  { titre: "Famille", sousTitre: "Simple, accessible, convivial", href: "/jeux?filtre=Familial" },
  { titre: "Amis 5+", sousTitre: "Ambiance et grandes tablées", href: "/jeux?filtre=Entre+amis+(5%2B)" },
  { titre: "Rapide", sousTitre: "Moins de 30 minutes", href: "/jeux?filtre=Ap%C3%A9ro+(<%2015+min)" },
  { titre: "Expert", sousTitre: "Stratégie et profondeur", href: "/jeux?filtre=Top+Expert" },
  { titre: "Cadeau", sousTitre: "Valeurs sûres à offrir", href: "/jeux?filtre=Id%C3%A9es+cadeaux" },
];

const QUICK_FILTERS = [
  { label: "2 joueurs", href: "/jeux?filtre=%C3%80+2" },
  { label: "30 min", href: "/jeux?filtre=Ap%C3%A9ro+(<%2015+min)" },
  { label: "Enfants", href: "/jeux?filtre=Pour+enfants" },
  { label: "Coopératif", href: "/jeux?filtre=Coop%C3%A9ratif" },
  { label: "Stratégie", href: "/jeux?filtre=Strat%C3%A9gie" },
];

const PRIX = [
  {
    prix: "Spiel des Jahres",
    jeu: "Cascadia",
    annee: "2023",
    description: "Placement de tuiles, objectifs clairs et parties très accessibles.",
  },
  {
    prix: "As d'Or",
    jeu: "Harmonies",
    annee: "2024",
    description: "Paysages à construire, choix tactiques et rythme familial.",
  },
  {
    prix: "Prix Urus",
    jeu: "Faraway",
    annee: "2024",
    description: "Cartes, planification inverse et excellente rejouabilité.",
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

export default async function Home() {
  const [coupsDeCoeur, jeuxCount] = await Promise.all([
    getJeuxBySlugs(SLUGS_COUPS_DE_COEUR),
    getJeuxCount(),
  ]);

  return (
    <div className="flex flex-col bg-white">
      <section className="relative bg-gradient-to-br from-amber-950 via-amber-900 to-amber-800 overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          <span className="float-a absolute text-7xl top-[10%] left-[5%]">🎲</span>
          <span className="float-b absolute text-5xl top-[20%] right-[8%]">♟️</span>
          <span className="float-c absolute text-6xl bottom-[25%] left-[12%]">🃏</span>
          <span className="float-a absolute text-4xl top-[55%] right-[15%]">🎯</span>
          <span className="float-b absolute text-5xl bottom-[15%] right-[5%]">🎰</span>
          <span className="float-c absolute text-3xl top-[35%] left-[2%]">🎮</span>
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-amber-600/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-orange-700/20 blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 py-20 md:py-28 text-center flex flex-col items-center gap-8">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-amber-200 text-xs font-semibold px-4 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {jeuxCount} jeux analysés et comparés
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight">
            Trouvez votre prochain<br />
            <span className="text-amber-400">jeu de société préféré</span>
          </h1>

          <p className="text-lg text-amber-200/80 max-w-xl">
            Fiches détaillées, règles résumées, comparateur de prix et recommandations personnalisées.
          </p>

          <HeroSearchBar />

          <div className="flex flex-wrap justify-center gap-2">
            {QUICK_FILTERS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-semibold text-amber-100 hover:bg-white/20 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-amber-100 bg-amber-50">
        <div className="max-w-6xl mx-auto px-4 py-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat value={String(jeuxCount)} label="jeux actifs" />
          <Stat value="4" label="boutiques comparées" />
          <Stat value="5 min" label="pour choisir" />
          <Stat value="Gratuit" label="accès libre" />
        </div>
      </section>

      <section className="bg-white py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-7">
            <div>
              <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">Départ rapide</p>
              <h2 className="text-3xl font-black text-amber-950">Je cherche un jeu pour...</h2>
            </div>
            <Link href="/jeux" className="text-sm font-semibold text-amber-700 hover:text-amber-900">
              Explorer tout le catalogue
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {INTENTIONS.map((item) => (
              <Link
                key={item.titre}
                href={item.href}
                className="group rounded-lg border border-amber-100 bg-white p-4 shadow-sm hover:border-amber-400 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-black text-amber-950">{item.titre}</h3>
                    <p className="mt-1 text-sm text-gray-600">{item.sousTitre}</p>
                  </div>
                  <span className="text-amber-700 group-hover:translate-x-0.5 transition-transform" aria-hidden="true">
                    -&gt;
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-amber-50 py-12 md:py-16 border-y border-amber-100">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-7">
            <div>
              <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">Sélection Lokidia</p>
              <h2 className="text-3xl font-black text-amber-950">Valeurs sûres pour commencer</h2>
            </div>
            <Link href="/jeux" className="text-sm font-semibold text-amber-700 hover:text-amber-900">
              Voir tous les jeux
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {coupsDeCoeur.map((jeu) => (
              <Link
                key={jeu.slug}
                href={`/jeu/${jeu.slug}`}
                className="group overflow-hidden rounded-lg border border-amber-100 bg-white shadow-sm hover:border-amber-400 hover:shadow-lg transition-all"
              >
                <div className="relative aspect-[4/3] bg-amber-100">
                  <Image
                    src={jeu.imageUrl || `https://placehold.co/480x360?text=${encodeURIComponent(jeu.nom)}`}
                    alt={jeu.nom}
                    fill
                    className="object-cover group-hover:scale-[1.02] transition-transform"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    unoptimized={!jeu.imageUrl || jeu.imageUrl.startsWith("/")}
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-black text-amber-800 shadow-sm">
                    {jeu.note}/10
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-black text-amber-950 group-hover:text-amber-700 transition-colors">
                    {jeu.nom}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">{jeu.description}</p>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <span className="rounded-md bg-amber-50 px-2 py-1">{jeu.joueursMin}-{jeu.joueursMax} joueurs</span>
                    <span className="rounded-md bg-amber-50 px-2 py-1">{jeu.dureeMin}-{jeu.dureeMax} min</span>
                    <span className="rounded-md bg-amber-50 px-2 py-1">{jeu.ageMin}+ ans</span>
                    <span className="rounded-md bg-amber-50 px-2 py-1">{jeu.complexite}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4 grid lg:grid-cols-[0.9fr_1.1fr] gap-8 items-start">
          <div>
            <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">Pourquoi Lokidia</p>
            <h2 className="text-3xl font-black text-amber-950">Moins d&apos;hésitation, plus de parties.</h2>
            <p className="mt-4 text-gray-600 leading-relaxed">
              L&apos;accueil doit vous aider à passer vite d&apos;une envie vague à quelques jeux pertinents, avec les infos qui comptent vraiment.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <Feature title="Règles résumées" text="Comprendre le principe avant d&apos;ouvrir la fiche." />
            <Feature title="Prix comparés" text="Repérez vite les boutiques disponibles." />
            <Feature title="Profils et listes" text="Gardez vos envies, parties et favoris au même endroit." />
          </div>
        </div>
      </section>

      <section className="bg-amber-950 py-12 md:py-16 text-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-7">
            <div>
              <p className="text-xs font-bold text-amber-300 uppercase tracking-widest mb-1">Récompenses</p>
              <h2 className="text-3xl font-black">Jeux repérés par la critique</h2>
            </div>
            <Link href="/jeux" className="text-sm font-semibold text-amber-200 hover:text-white">
              Rechercher un lauréat
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PRIX.map((item) => (
              <Link
                key={item.prix}
                href={`/jeux?q=${encodeURIComponent(item.jeu)}`}
                className="rounded-lg border border-white/10 bg-white/8 p-5 hover:bg-white/12 transition-colors"
              >
                <p className="text-sm font-bold text-amber-300">{item.prix} - {item.annee}</p>
                <h3 className="mt-2 text-2xl font-black">{item.jeu}</h3>
                <p className="mt-3 text-sm leading-relaxed text-amber-100/75">{item.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border border-amber-100 bg-white px-4 py-3">
      <p className="text-2xl font-black text-amber-900">{value}</p>
      <p className="text-xs font-semibold text-gray-500">{label}</p>
    </div>
  );
}

function Feature({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
      <h3 className="font-black text-amber-950">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">{text}</p>
    </div>
  );
}
