import { cache } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getJeuBySlug, getAllJeuxSlugs } from "@/lib/jeux-repository";
import ComparateurPrix from "@/components/ComparateurPrix";
import DescriptionExpand from "@/components/DescriptionExpand";
import { Complexite } from "@/types/jeu";

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
  const jeu = await loadJeu(slug);

  if (!jeu) notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/jeux" className="text-amber-700 hover:underline text-sm mb-6 inline-block">
        Retour aux jeux
      </Link>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col gap-6">

        {/* ── Image principale ── */}
        <div className="relative h-64 bg-gray-100 flex items-center justify-center">
          {jeu.imageUrl ? (
            <Image
              src={jeu.imageUrl}
              alt={jeu.nom}
              fill
              className="object-contain p-4"
              unoptimized
              priority
            />
          ) : (
            <span className="text-7xl select-none">🎲</span>
          )}
        </div>

        <div className="px-8 pb-8 flex flex-col gap-6">

          {/* ── Titre + note ── */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-amber-900">{jeu.nom}</h1>
              <p className="text-gray-500 mt-1">{jeu.annee}</p>
            </div>
            {jeu.note > 0 && (
              <div className="bg-amber-100 text-amber-800 text-lg font-bold px-4 py-2 rounded-xl shrink-0">
                {jeu.note}/10
              </div>
            )}
          </div>

          {/* ── Description ── */}
          <DescriptionExpand text={jeu.description} />

          {/* ── Pourquoi ce jeu ? ── */}
          {(jeu.pointsForts?.length ?? 0) > 0 && (
            <div className="bg-amber-50 rounded-2xl p-5">
              <h2 className="text-base font-bold text-amber-900 mb-3">Pourquoi ce jeu ?</h2>
              <ul className="flex flex-col gap-2">
                {(jeu.pointsForts ?? []).map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-emerald-600 font-bold shrink-0 mt-0.5">✔</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── Caractéristiques ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Joueurs", value: `${jeu.joueursMin}-${jeu.joueursMax}`, icon: "👥" },
              { label: "Durée", value: `${jeu.dureeMin}-${jeu.dureeMax} min`, icon: "⏱️" },
              { label: "Âge", value: `${jeu.ageMin}+`, icon: "🎂" },
              { label: "Complexité", value: jeu.complexite, icon: "🧠", color: getComplexiteColor(jeu.complexite) },
            ].map(({ label, value, icon, color }) => (
              <div key={label} className="bg-amber-50 rounded-xl p-3 text-center">
                <div className="text-xl mb-1">{icon}</div>
                <div className={`font-semibold text-sm ${color ?? "text-amber-900"}`}>{value}</div>
                <div className="text-xs text-gray-500">{label}</div>
              </div>
            ))}
          </div>

          {/* ── Catégories & mécaniques ── */}
          <div className="flex flex-col gap-3">
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Catégories</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {jeu.categories.map((cat) => (
                  <span key={cat} className="bg-amber-100 text-amber-800 text-sm px-3 py-1 rounded-full">
                    {cat}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mécaniques</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {jeu.mecaniques.map((m) => (
                  <span key={m} className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ── Comment jouer ? ── */}
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

          {/* ── Comparateur prix ── */}
          <div className="max-w-sm">
            <ComparateurPrix nomJeu={jeu.nom} acheter={jeu.acheter} />
          </div>

        </div>
      </div>
    </div>
  );
}
