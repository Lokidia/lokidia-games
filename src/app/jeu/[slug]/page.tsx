import { cache } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getJeuBySlug, getAllJeuxSlugs } from "@/lib/jeux-repository";
import { createServiceClient } from "@/utils/supabase/service";
import ComparateurPrix from "@/components/ComparateurPrix";
import DescriptionExpand from "@/components/DescriptionExpand";
import LudothequeButtons from "@/components/LudothequeButtons";
import { Complexite } from "@/types/jeu";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lokidia.games";

interface RelatedGame {
  id: string;
  slug: string;
  nom: string;
  image_url: string | null;
  note: number;
}

interface Relation {
  type: string;
  jeu_lie: RelatedGame;
}

async function getRelations(slug: string): Promise<Relation[]> {
  try {
    const sb = createServiceClient();
    const { data: jeu } = await sb.from("jeux").select("id").eq("slug", slug).single();
    if (!jeu) return [];
    const { data } = await sb
      .from("jeux_relations")
      .select("type, jeu_lie:jeu_lie_id(id, slug, nom, image_url, note)")
      .eq("jeu_id", (jeu as { id: string }).id);
    return (data ?? []) as unknown as Relation[];
  } catch {
    return [];
  }
}

function getComplexiteColor(complexite: Complexite): string {
  if (complexite === "Simple") return "text-green-500";
  if (complexite === "Complexe") return "text-orange-500";
  if (complexite === "Expert") return "text-red-600";
  if (complexite.includes("Inter")) return "text-yellow-600";
  return "text-green-600";
}

export async function generateStaticParams() {
  const slugs = await getAllJeuxSlugs();
  return slugs.map((slug) => ({ slug }));
}

const loadJeu = cache(async (slug: string) => getJeuBySlug(slug));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const jeu = await loadJeu(slug);
  if (!jeu) return { title: "Jeu introuvable — Lokidia Games" };

  const description = jeu.description
    ? jeu.description.slice(0, 155).trimEnd() + (jeu.description.length > 155 ? "…" : "")
    : `Découvrez ${jeu.nom} : règles, prix et avis sur Lokidia Games.`;

  const title = `${jeu.nom} — Règles, prix et avis | Lokidia Games`;
  const canonical = `/jeu/${slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, locale: "fr_FR", type: "article" },
  };
}

export default async function FicheJeu({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [jeu, relations] = await Promise.all([loadJeu(slug), getRelations(slug)]);

  if (!jeu) notFound();

  const extensions = relations.filter((r) => r.type === "extension");
  const similaires = relations.filter((r) => r.type === "similaire");

  // Breadcrumb: use the first categoryLink as the "main category"
  const mainCat = jeu.categoryLinks?.[0] ?? null;

  // JSON-LD: BreadcrumbList
  const breadcrumbItems = [
    { "@type": "ListItem", position: 1, name: "Accueil",     item: `${SITE_URL}/` },
    { "@type": "ListItem", position: 2, name: "Jeux",        item: `${SITE_URL}/jeux` },
    ...(mainCat
      ? [{ "@type": "ListItem", position: 3, name: mainCat.nom, item: `${SITE_URL}/jeux/categorie/${mainCat.slug}` }]
      : []),
    { "@type": "ListItem", position: mainCat ? 4 : 3, name: jeu.nom, item: `${SITE_URL}/jeu/${slug}` },
  ];

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems,
  };

  // JSON-LD: Game
  const gameJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Game",
    name: jeu.nom,
    description: jeu.description,
    url: `${SITE_URL}/jeu/${slug}`,
    numberOfPlayers: {
      "@type": "QuantitativeValue",
      minValue: jeu.joueursMin,
      maxValue: jeu.joueursMax,
    },
    typicalAgeRange: `${jeu.ageMin}-`,
    ...(jeu.imageUrl ? { image: jeu.imageUrl } : {}),
  };

  if (jeu.note > 0) {
    gameJsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: jeu.note,
      bestRating: 10,
      worstRating: 0,
      ratingCount: 1,
    };
  }

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(gameJsonLd) }}
      />

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* ── Breadcrumb ── */}
        <nav aria-label="Fil d'Ariane" className="flex items-center gap-1.5 text-sm text-gray-500 mb-6 flex-wrap">
          <Link href="/" className="hover:text-amber-700 transition-colors">Accueil</Link>
          <span className="text-gray-300">›</span>
          <Link href="/jeux" className="hover:text-amber-700 transition-colors">Jeux</Link>
          {mainCat && (
            <>
              <span className="text-gray-300">›</span>
              <Link href={`/jeux/categorie/${mainCat.slug}`} className="hover:text-amber-700 transition-colors">
                {mainCat.nom}
              </Link>
            </>
          )}
          <span className="text-gray-300">›</span>
          <span className="text-amber-800 font-semibold">{jeu.nom}</span>
        </nav>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">

          {/* ── Hero cinématique ── */}
          <div className="relative w-full h-80 overflow-hidden">
            {jeu.imageUrl ? (
              <Image
                src={jeu.imageUrl}
                alt={jeu.nom}
                fill
                className="object-cover"
                unoptimized
                priority
              />
            ) : (
              <div className="w-full h-full bg-gray-800" />
            )}
            {/* Dégradé sombre bas → haut */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            {/* Titre + année en bas à gauche */}
            <div className="absolute bottom-0 left-0 right-0 px-7 pb-6 flex items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black text-white leading-tight drop-shadow-lg">{jeu.nom}</h1>
                <p className="text-white/70 text-sm mt-1">{jeu.annee}</p>
              </div>
              {jeu.note > 0 && (
                <div className="flex items-center gap-1.5 bg-amber-500 text-white text-sm font-black px-3 py-1.5 rounded-xl shadow-lg shrink-0">
                  <span>⭐</span>
                  <span>{jeu.note}/10</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Contenu ── */}
          <div className="px-8 pb-8 flex flex-col gap-6 pt-6">

            {/* Ludothèque */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Ma ludothèque</p>
              <LudothequeButtons jeuId={jeu.id} />
            </div>

            {/* Description */}
            <DescriptionExpand text={jeu.description} />

            {/* Pourquoi ce jeu ? */}
            {(jeu.pointsForts?.length ?? 0) > 0 && (
              <div className="bg-amber-50 rounded-2xl p-4">
                <h2 className="text-sm font-bold text-amber-900 mb-2">Pourquoi ce jeu ?</h2>
                <ul className="flex flex-col gap-1.5">
                  {(jeu.pointsForts ?? []).map((point, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-emerald-600 font-bold shrink-0 mt-0.5">✔</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Caractéristiques */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Joueurs",    value: `${jeu.joueursMin}–${jeu.joueursMax}`,   icon: "👥" },
                { label: "Durée",      value: `${jeu.dureeMin}–${jeu.dureeMax} min`,   icon: "⏱️" },
                { label: "Âge",        value: `${jeu.ageMin}+`,                         icon: "🎂" },
                { label: "Complexité", value: jeu.complexite, icon: "🧠", color: getComplexiteColor(jeu.complexite) },
              ].map(({ label, value, icon, color }) => (
                <div key={label} className="bg-amber-50 rounded-xl p-3 text-center">
                  <div className="text-xl mb-1">{icon}</div>
                  <div className={`font-semibold text-sm ${color ?? "text-amber-900"}`}>{value}</div>
                  <div className="text-xs text-gray-500">{label}</div>
                </div>
              ))}
            </div>

            {/* Catégories & mécaniques */}
            <div className="flex flex-col gap-3">
              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Catégories</span>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {(jeu.categoryLinks && jeu.categoryLinks.length > 0
                    ? jeu.categoryLinks
                    : jeu.categories.map((nom) => ({ nom, slug: "" }))
                  ).map(({ nom, slug: catSlug }) =>
                    catSlug ? (
                      <Link
                        key={catSlug}
                        href={`/jeux/categorie/${catSlug}`}
                        className="bg-amber-100 text-amber-800 text-sm px-3 py-1 rounded-full hover:bg-amber-200 transition-colors"
                      >
                        {nom}
                      </Link>
                    ) : (
                      <span key={nom} className="bg-amber-100 text-amber-800 text-sm px-3 py-1 rounded-full">
                        {nom}
                      </span>
                    )
                  )}
                </div>
              </div>
              {jeu.mecaniques.length > 0 && (
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mécaniques</span>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {jeu.mecaniques.map((m) => (
                      <span key={m} className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Comment jouer ? */}
            {jeu.regles.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-amber-900 mb-3">Comment jouer ?</h2>
                <ul className="flex flex-col gap-2">
                  {jeu.regles.map((regle, i) => (
                    <li key={i} className="flex gap-3 text-gray-700">
                      <span className="bg-amber-700 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {regle}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Ambiance sonore Spotify */}
            {(jeu.spotifyPlaylistId ?? jeu.categorySpotifyPlaylistId) && (
              <div>
                <h2 className="text-lg font-bold text-amber-900 mb-3">🎵 Ambiance sonore</h2>
                <iframe
                  src={`https://open.spotify.com/embed/playlist/${jeu.spotifyPlaylistId ?? jeu.categorySpotifyPlaylistId}?utm_source=generator&theme=0`}
                  width="100%"
                  height="152"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  allowFullScreen
                  className="rounded-xl border-0"
                />
              </div>
            )}

            {/* Comparateur prix */}
            <div className="max-w-sm">
              <ComparateurPrix nomJeu={jeu.nom} acheter={jeu.acheter} />
            </div>

            {/* Extensions disponibles */}
            {extensions.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-amber-900 mb-3">Extensions disponibles</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {extensions.map((r) => (
                    <Link
                      key={r.jeu_lie.slug}
                      href={`/jeu/${r.jeu_lie.slug}`}
                      className="flex items-center gap-3 bg-amber-50 hover:bg-amber-100 border border-amber-100 rounded-xl p-3 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-white shrink-0 relative">
                        {r.jeu_lie.image_url ? (
                          <Image src={r.jeu_lie.image_url} alt={r.jeu_lie.nom} fill className="object-cover" unoptimized />
                        ) : (
                          <span className="flex items-center justify-center h-full text-lg">🎲</span>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-amber-900 leading-tight line-clamp-2">{r.jeu_lie.nom}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Vous aimerez aussi */}
            {similaires.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-amber-900 mb-3">Vous aimerez aussi</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {similaires.map((r) => (
                    <Link
                      key={r.jeu_lie.slug}
                      href={`/jeu/${r.jeu_lie.slug}`}
                      className="flex items-center gap-3 bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-xl p-3 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-white shrink-0 relative">
                        {r.jeu_lie.image_url ? (
                          <Image src={r.jeu_lie.image_url} alt={r.jeu_lie.nom} fill className="object-cover" unoptimized />
                        ) : (
                          <span className="flex items-center justify-center h-full text-lg">🎲</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 leading-tight line-clamp-2">{r.jeu_lie.nom}</p>
                        {r.jeu_lie.note > 0 && (
                          <p className="text-xs text-amber-600 font-bold mt-0.5">⭐ {r.jeu_lie.note}/10</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
