"use client";

import Image from "next/image";
import Link from "next/link";
import { Jeu } from "@/types/jeu";

interface Props {
  jeu: Jeu;
}

export default function CarteJeu({ jeu }: Props) {
  const imageSrc = jeu.imageUrl || `https://placehold.co/300x200?text=${encodeURIComponent(jeu.nom)}`;

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all border border-amber-100 hover:border-amber-300 flex flex-col">
      <Link href={`/jeu/${jeu.slug}`} className="flex flex-col gap-3 flex-1">
        <div className="relative w-full h-40 rounded-t-xl overflow-hidden">
          <Image
            src={imageSrc}
            alt={jeu.nom}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
            unoptimized={!jeu.imageUrl || jeu.imageUrl.startsWith("/")}
          />
        </div>
        <div className="flex flex-col gap-3 p-5 pt-3 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-lg font-bold text-amber-900 leading-tight">{jeu.nom}</h2>
          {jeu.note > 0 && (
            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap">
              ⭐ {jeu.note}/10
            </span>
          )}
        </div>

        <p className="text-sm text-gray-600 line-clamp-2 flex-1">{jeu.description}</p>

        <div className="flex flex-wrap gap-1">
          {jeu.categories.map((cat) => (
            <span
              key={cat}
              className="bg-amber-50 text-amber-700 text-xs px-2 py-0.5 rounded-full border border-amber-200"
            >
              {cat}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-gray-500 pt-1 border-t border-gray-100">
          <span>👥 {jeu.joueursMin}–{jeu.joueursMax} joueurs</span>
          <span>⏱ {jeu.dureeMin}–{jeu.dureeMax} min</span>
          <span>🎂 {jeu.ageMin}+</span>
          <span>🧠 {jeu.complexite}</span>
        </div>
        </div>
      </Link>

      <div className="px-5 pb-5">
        <Link
          href={`/jeu/${jeu.slug}`}
          className="block w-full text-center bg-amber-700 hover:bg-amber-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          Voir le jeu →
        </Link>
      </div>
    </div>
  );
}
