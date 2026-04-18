"use client";

import { useState, useRef, useEffect } from "react";
import { AcheterJeu, PrixMarchand } from "@/types/jeu";

interface Marchand {
  cle: keyof AcheterJeu;
  nom: string;
  logo: string;
  couleurHover: string;
  couleurBadge: string;
  data: PrixMarchand;
}

function parsePrix(p: string): number {
  return parseFloat(p.replace(",", ".").replace("€", "").trim());
}

function trouverMinPrix(acheter: AcheterJeu): number {
  return Math.min(
    parsePrix(acheter.amazon.prix),
    parsePrix(acheter.philibert.prix),
    parsePrix(acheter.cultura.prix),
    parsePrix(acheter.fnac.prix)
  );
}

function afficherPrix(p: number): string {
  return p.toFixed(2).replace(".", ",") + "€";
}

function buildMarchands(acheter: AcheterJeu): Marchand[] {
  return [
    {
      cle: "amazon",
      nom: "Amazon",
      logo: "📦",
      couleurHover: "hover:bg-orange-50 hover:border-orange-200",
      couleurBadge: "bg-orange-100 text-orange-700",
      data: acheter.amazon,
    },
    {
      cle: "philibert",
      nom: "Philibert",
      logo: "🎲",
      couleurHover: "hover:bg-blue-50 hover:border-blue-200",
      couleurBadge: "bg-blue-100 text-blue-700",
      data: acheter.philibert,
    },
    {
      cle: "cultura",
      nom: "Cultura",
      logo: "🏪",
      couleurHover: "hover:bg-green-50 hover:border-green-200",
      couleurBadge: "bg-green-100 text-green-700",
      data: acheter.cultura,
    },
    {
      cle: "fnac",
      nom: "Fnac",
      logo: "🟡",
      couleurHover: "hover:bg-yellow-50 hover:border-yellow-200",
      couleurBadge: "bg-yellow-100 text-yellow-700",
      data: acheter.fnac,
    },
  ];
}

interface Props {
  nomJeu: string;
  acheter?: AcheterJeu;
}

export default function ComparateurPrix({ nomJeu, acheter }: Props) {
  const [ouvert, setOuvert] = useState(false);
  const panneauRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ouvert) return;
    function fermerSiExterieur(e: MouseEvent) {
      if (panneauRef.current && !panneauRef.current.contains(e.target as Node)) {
        setOuvert(false);
      }
    }
    document.addEventListener("mousedown", fermerSiExterieur);
    return () => document.removeEventListener("mousedown", fermerSiExterieur);
  }, [ouvert]);

  const minPrix = acheter ? trouverMinPrix(acheter) : null;
  const marchands = acheter ? buildMarchands(acheter) : [];

  return (
    <div className="relative" ref={panneauRef}>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOuvert(!ouvert);
        }}
        className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white text-sm font-semibold py-2.5 px-4 rounded-xl transition-colors shadow-sm"
      >
        <span>🛒</span>
        <span>
          Meilleur prix
          {minPrix !== null && (
            <span className="font-bold"> — dès {afficherPrix(minPrix)}</span>
          )}
        </span>
        <svg
          className={`w-3.5 h-3.5 ml-auto transition-transform ${ouvert ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {ouvert && (
        <div
          className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-2xl shadow-2xl border border-amber-100 overflow-hidden z-50"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-4 pt-3 pb-2 border-b border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">
                Comparer les prix
              </p>
              <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[180px]">{nomJeu}</p>
            </div>
            {minPrix !== null && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full whitespace-nowrap">
                Dès {afficherPrix(minPrix)}
              </span>
            )}
          </div>

          <div className="p-2 flex flex-col gap-1">
            {marchands.map((m) => {
              const prix = parsePrix(m.data.prix);
              const estLeMoinscher = minPrix !== null && prix === minPrix;

              return (
                <a
                  key={m.cle}
                  href={m.data.url}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border border-transparent transition-all ${m.couleurHover} ${estLeMoinscher ? "ring-1 ring-emerald-300 bg-emerald-50" : ""}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-base w-5 text-center shrink-0">{m.logo}</span>
                  <span className="flex-1 text-sm font-medium text-gray-700">{m.nom}</span>

                  <div className="flex items-center gap-2">
                    {estLeMoinscher && (
                      <span className="text-xs font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                        🏆 Meilleur
                      </span>
                    )}
                    <span className={`text-sm font-bold ${estLeMoinscher ? "text-emerald-700" : "text-gray-800"}`}>
                      {m.data.prix}
                    </span>
                    <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                </a>
              );
            })}
          </div>

          <p className="px-4 pb-3 text-xs text-gray-400 text-center">
            * Prix indicatifs, liens affiliés
          </p>
        </div>
      )}
    </div>
  );
}
