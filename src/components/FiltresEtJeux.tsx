"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Jeu, Complexite } from "@/types/jeu";
import CarteJeu from "./CarteJeu";

/* ─── Types ─── */

type CleFiltre = "joueurs" | "duree" | "complexite" | "prix";

interface EtatFiltres {
  joueurs: string[];
  duree: string[];
  complexite: string[];
  prix: string[];
}

/* ─── Groupes de filtres ─── */

const GROUPES: {
  cle: CleFiltre;
  titre: string;
  icone: string;
  options: string[];
}[] = [
  {
    cle: "joueurs",
    titre: "Nombre de joueurs",
    icone: "👥",
    options: ["Solo", "2 joueurs", "3-4 joueurs", "5+"],
  },
  {
    cle: "duree",
    titre: "Durée de partie",
    icone: "⏱",
    options: ["< 30 min", "30-60 min", "1-2h", "2h+"],
  },
  {
    cle: "complexite",
    titre: "Complexité",
    icone: "🧠",
    options: ["Très simple", "Simple", "Intermédiaire", "Complexe", "Expert"],
  },
  {
    cle: "prix",
    titre: "Prix minimum",
    icone: "💰",
    options: ["< 20€", "20-40€", "40-60€", "60€+"],
  },
];

/* ─── Helpers ─── */

function getPrixMin(jeu: Jeu): number {
  return Math.min(
    ...Object.values(jeu.acheter).map((m) =>
      parseFloat(m.prix.replace(",", ".").replace("€", "").trim())
    )
  );
}

function appliquerFiltres(jeux: Jeu[], filtres: EtatFiltres, recherche: string): Jeu[] {
  return jeux.filter((jeu) => {
    // Recherche textuelle
    if (recherche.trim()) {
      const q = recherche.toLowerCase();
      const match =
        jeu.nom.toLowerCase().includes(q) ||
        jeu.description.toLowerCase().includes(q) ||
        jeu.categories.some((c) => c.toLowerCase().includes(q)) ||
        jeu.mecaniques.some((m) => m.toLowerCase().includes(q));
      if (!match) return false;
    }

    // Joueurs (OR dans le groupe)
    if (filtres.joueurs.length > 0) {
      const ok = filtres.joueurs.some((f) => {
        if (f === "Solo") return jeu.joueursMin === 1;
        if (f === "2 joueurs") return jeu.joueursMin <= 2 && jeu.joueursMax >= 2;
        if (f === "3-4 joueurs") return jeu.joueursMin <= 4 && jeu.joueursMax >= 3;
        if (f === "5+") return jeu.joueursMax >= 5;
        return false;
      });
      if (!ok) return false;
    }

    // Durée (OR)
    if (filtres.duree.length > 0) {
      const ok = filtres.duree.some((f) => {
        if (f === "< 30 min") return jeu.dureeMin < 30;
        if (f === "30-60 min") return jeu.dureeMax >= 30 && jeu.dureeMin <= 60;
        if (f === "1-2h") return jeu.dureeMax >= 60 && jeu.dureeMin <= 120;
        if (f === "2h+") return jeu.dureeMax >= 120;
        return false;
      });
      if (!ok) return false;
    }

    // Complexité (OR)
    if (filtres.complexite.length > 0) {
      if (!filtres.complexite.includes(jeu.complexite)) return false;
    }

    // Prix (OR)
    if (filtres.prix.length > 0) {
      const p = getPrixMin(jeu);
      const ok = filtres.prix.some((f) => {
        if (f === "< 20€") return p < 20;
        if (f === "20-40€") return p >= 20 && p < 40;
        if (f === "40-60€") return p >= 40 && p < 60;
        if (f === "60€+") return p >= 60;
        return false;
      });
      if (!ok) return false;
    }

    return true;
  });
}

/* ─── Sous-composant : un groupe de filtres ─── */

function GroupeFiltre({
  groupe,
  selectionnes,
  onToggle,
  onEffacer,
}: {
  groupe: (typeof GROUPES)[0];
  selectionnes: string[];
  onToggle: (val: string) => void;
  onEffacer: () => void;
}) {
  return (
    <div className="border-b border-amber-100 pb-4 last:border-0 last:pb-0">
      <div className="flex items-center justify-between mb-3">
        <span className="flex items-center gap-1.5 text-sm font-bold text-amber-900">
          <span>{groupe.icone}</span>
          {groupe.titre}
        </span>
        {selectionnes.length > 0 && (
          <button
            onClick={onEffacer}
            className="text-xs text-amber-600 hover:text-amber-800 transition-colors"
          >
            Effacer
          </button>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {groupe.options.map((option) => {
          const actif = selectionnes.includes(option);
          return (
            <label
              key={option}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div
                onClick={() => onToggle(option)}
                className={`w-4 h-4 rounded flex items-center justify-center border-2 transition-all shrink-0 ${
                  actif
                    ? "bg-amber-700 border-amber-700"
                    : "border-amber-200 group-hover:border-amber-400"
                }`}
              >
                {actif && (
                  <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span
                onClick={() => onToggle(option)}
                className={`text-sm transition-colors ${
                  actif ? "text-amber-900 font-semibold" : "text-gray-600 group-hover:text-amber-800"
                }`}
              >
                {option}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Composant principal ─── */

interface Props {
  jeux: Jeu[];
  searchQuery?: string;
  filtreInitial?: string;
  categorieTitre?: string;
  categorieSlug?: string;
}

const FILTRES_VIDES: EtatFiltres = { joueurs: [], duree: [], complexite: [], prix: [] };

export default function FiltresEtJeux({ jeux, searchQuery = "", filtreInitial, categorieTitre, categorieSlug }: Props) {
  const [filtres, setFiltres] = useState<EtatFiltres>(() => {
    // Applique le filtre initial depuis l'URL (catégorie depuis le méga-menu)
    if (filtreInitial) {
      const val = decodeURIComponent(filtreInitial);
      const complexites: Complexite[] = ["Très simple", "Simple", "Intermédiaire", "Complexe", "Expert"];
      if (complexites.includes(val as Complexite)) {
        return { ...FILTRES_VIDES, complexite: [val] };
      }
    }
    return FILTRES_VIDES;
  });

  const [recherche, setRecherche] = useState(searchQuery);
  const [mobileOuvert, setMobileOuvert] = useState(false);

  const nbFiltresActifs =
    filtres.joueurs.length + filtres.duree.length + filtres.complexite.length + filtres.prix.length;

  const jeuFiltres = useMemo(
    () => appliquerFiltres(jeux, filtres, recherche),
    [jeux, filtres, recherche]
  );

  function toggleFiltre(cle: CleFiltre, valeur: string) {
    setFiltres((prev) => {
      const actuel = prev[cle];
      return {
        ...prev,
        [cle]: actuel.includes(valeur)
          ? actuel.filter((v) => v !== valeur)
          : [...actuel, valeur],
      };
    });
  }

  function effacerGroupe(cle: CleFiltre) {
    setFiltres((prev) => ({ ...prev, [cle]: [] }));
  }

  function toutEffacer() {
    setFiltres(FILTRES_VIDES);
    setRecherche("");
  }

  const panneauFiltres = (
    <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5 flex flex-col gap-5">
      {/* En-tête panneau */}
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-amber-900 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
          </svg>
          Filtres
          {nbFiltresActifs > 0 && (
            <span className="bg-amber-700 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {nbFiltresActifs}
            </span>
          )}
        </h2>
        {nbFiltresActifs > 0 && (
          <button
            onClick={toutEffacer}
            className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
          >
            Tout effacer
          </button>
        )}
      </div>

      {/* Recherche rapide */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher..."
          className="w-full pl-8 pr-3 py-2 text-sm border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 bg-amber-50/50"
        />
        {recherche && (
          <button onClick={() => setRecherche("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Groupes */}
      {GROUPES.map((groupe) => (
        <GroupeFiltre
          key={groupe.cle}
          groupe={groupe}
          selectionnes={filtres[groupe.cle]}
          onToggle={(val) => toggleFiltre(groupe.cle, val)}
          onEffacer={() => effacerGroupe(groupe.cle)}
        />
      ))}
    </div>
  );

  return (
    <div>
      {/* En-tête page */}
      <div className="mb-6 flex items-end justify-between flex-wrap gap-3">
        <div>
          {/* Breadcrumb when filtering by category */}
          {categorieTitre && (
            <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
              <Link href="/" className="hover:text-amber-600 transition-colors">Accueil</Link>
              <span>›</span>
              <Link href="/jeux" className="hover:text-amber-600 transition-colors">Jeux</Link>
              <span>›</span>
              <span className="text-amber-700 font-semibold">{categorieTitre}</span>
            </nav>
          )}
          <h1 className="text-3xl font-bold text-amber-900">
            {categorieTitre ? `Jeux ${categorieTitre}` : "Tous les jeux"}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {jeuFiltres.length === jeux.length
              ? `${jeux.length} jeu${jeux.length > 1 ? "x" : ""} dans l'encyclopédie`
              : `${jeuFiltres.length} jeu${jeuFiltres.length > 1 ? "x" : ""} sur ${jeux.length}`}
          </p>
          {categorieSlug && (
            <Link
              href={`/jeux/categorie/${categorieSlug}`}
              className="inline-block mt-1 text-xs text-amber-600 hover:text-amber-800 transition-colors"
            >
              Page dédiée →
            </Link>
          )}
        </div>

        {/* Bouton mobile */}
        <button
          className="lg:hidden flex items-center gap-2 bg-white border border-amber-200 hover:border-amber-400 text-amber-900 text-sm font-semibold px-4 py-2 rounded-xl shadow-sm transition-colors"
          onClick={() => setMobileOuvert(!mobileOuvert)}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
          </svg>
          Filtres
          {nbFiltresActifs > 0 && (
            <span className="bg-amber-700 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {nbFiltresActifs}
            </span>
          )}
        </button>
      </div>

      {/* Panneau mobile */}
      {mobileOuvert && (
        <div className="lg:hidden mb-6">{panneauFiltres}</div>
      )}

      {/* Tags des filtres actifs */}
      {nbFiltresActifs > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {(Object.entries(filtres) as [CleFiltre, string[]][]).flatMap(([cle, vals]) =>
            vals.map((val) => (
              <span
                key={`${cle}-${val}`}
                className="flex items-center gap-1.5 bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full"
              >
                {val}
                <button onClick={() => toggleFiltre(cle, val)} className="hover:text-amber-950 transition-colors">
                  <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                    <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
                  </svg>
                </button>
              </span>
            ))
          )}
        </div>
      )}

      {/* Layout principal */}
      <div className="flex gap-6 items-start">
        {/* Sidebar desktop */}
        <aside className="hidden lg:block w-60 shrink-0 sticky top-4">
          {panneauFiltres}
        </aside>

        {/* Grille de jeux */}
        <div className="flex-1 min-w-0">
          {jeuFiltres.length === 0 ? (
            <div className="bg-white rounded-2xl border border-amber-100 p-12 text-center">
              <span className="text-5xl block mb-4">🎲</span>
              <p className="text-lg font-semibold text-amber-900 mb-1">Aucun jeu trouvé</p>
              <p className="text-sm text-gray-500 mb-4">Essaie d&apos;élargir tes critères de recherche.</p>
              <button
                onClick={toutEffacer}
                className="bg-amber-700 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-amber-800 transition-colors"
              >
                Effacer tous les filtres
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {jeuFiltres.map((jeu) => (
                <CarteJeu key={jeu.slug} jeu={jeu} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
