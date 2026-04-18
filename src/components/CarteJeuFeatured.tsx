"use client";

import Image from "next/image";
import Link from "next/link";
import { Jeu } from "@/types/jeu";

const CATEGORY_COLORS: Record<string, string> = {
  Stratégie:  "from-blue-800 to-blue-600",
  Coopératif: "from-emerald-800 to-emerald-600",
  Familial:   "from-orange-700 to-orange-500",
  Ambiance:   "from-purple-800 to-purple-600",
  Expert:     "from-red-800 to-red-600",
  Solo:       "from-teal-800 to-teal-600",
};

function getGradient(categories: string[]): string {
  for (const cat of categories) {
    if (CATEGORY_COLORS[cat]) return CATEGORY_COLORS[cat];
  }
  return "from-amber-800 to-amber-600";
}

interface Props {
  jeu: Jeu;
}

export default function CarteJeuFeatured({ jeu }: Props) {
  const gradient = getGradient(jeu.categories);
  const imageSrc = jeu.imageUrl || `https://placehold.co/112x160?text=${encodeURIComponent(jeu.nom)}`;

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all border border-amber-100 hover:border-amber-300 flex overflow-hidden">
      {/* Panneau gauche : image + overlay coloré */}
      <div className={`bg-gradient-to-b ${gradient} w-28 shrink-0 flex flex-col items-center justify-center gap-2 p-4 relative overflow-hidden`}>
        <div className="absolute inset-0">
          <Image
            src={imageSrc}
            alt={jeu.nom}
            fill
            className="object-cover opacity-30"
            sizes="112px"
            unoptimized={!jeu.imageUrl || jeu.imageUrl.startsWith("/")}
          />
        </div>
        <div className="relative flex flex-col items-center">
          <span className="text-2xl font-black text-white leading-none">{jeu.note}</span>
          <span className="text-xs text-white/70 font-medium">/10</span>
          <span className="text-yellow-300 text-sm mt-0.5">⭐</span>
        </div>
        <div className="relative w-8 h-px bg-white/30 my-1" />
        <span className="relative text-white/70 text-xs font-medium">{jeu.annee}</span>
        <span className="relative text-white/50 text-lg mt-1">🎲</span>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col p-5 min-w-0">
        <div className="flex-1">
          <Link href={`/jeu/${jeu.slug}`}>
            <h3 className="text-xl font-bold text-amber-900 hover:text-amber-700 transition-colors mb-1 leading-tight">
              {jeu.nom}
            </h3>
          </Link>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {jeu.categories.map((cat) => (
              <span key={cat} className="bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {cat}
              </span>
            ))}
            {jeu.mecaniques.slice(0, 2).map((m) => (
              <span key={m} className="bg-gray-100 text-gray-600 text-xs px-2.5 py-0.5 rounded-full">
                {m}
              </span>
            ))}
          </div>

          <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 mb-4">
            {jeu.description}
          </p>

          <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-4">
            <span>👥 {jeu.joueursMin}–{jeu.joueursMax} joueurs</span>
            <span>⏱ {jeu.dureeMin}–{jeu.dureeMax} min</span>
            <span>🎂 {jeu.ageMin}+</span>
            <span>🧠 {jeu.complexite}</span>
          </div>
        </div>

        <Link
          href={`/jeu/${jeu.slug}`}
          className="inline-flex items-center gap-1.5 bg-amber-700 hover:bg-amber-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          Voir le jeu →
        </Link>
      </div>
    </div>
  );
}
