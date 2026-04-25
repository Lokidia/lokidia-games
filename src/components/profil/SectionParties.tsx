"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import NouvellePartieForm from "@/components/NouvellePartieForm";

interface Jeu { slug: string; nom: string; image_url: string | null }
interface Partie {
  id: string;
  date_partie: string;
  duree_minutes: number | null;
  notes: string | null;
  joueurs: string[];
  gagnant_id: string | null;
  createur_id: string;
  jeux: Jeu | null;
}

export default function SectionParties() {
  const [parties, setParties]   = useState<Partie[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/parties");
    if (res.ok) {
      const data = await res.json() as { parties: Partie[] };
      setParties(data.parties);
    }
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(true)}
          className="bg-amber-700 hover:bg-amber-800 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors shadow-sm"
        >
          + Nouvelle partie
        </button>
      </div>

      {showForm && (
        <NouvellePartieForm
          onClose={() => setShowForm(false)}
          onCreated={() => { setShowForm(false); refresh(); }}
        />
      )}

      {loading ? (
        <div className="py-12 text-center text-gray-400 text-sm">Chargement…</div>
      ) : parties.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-amber-200 p-12 text-center">
          <p className="text-5xl mb-3">🎲</p>
          <p className="text-gray-500 text-sm">Aucune partie enregistrée.</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-block mt-4 text-amber-700 font-semibold hover:underline text-sm"
          >
            Enregistrer une partie →
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {parties.map(p => (
            <div key={p.id} className="bg-white rounded-2xl border border-amber-100 shadow-sm p-4 flex gap-4 items-start hover:border-amber-200 transition-colors">
              <div className="text-center shrink-0 w-11 bg-amber-50 rounded-xl py-1.5">
                <p className="text-xs font-bold text-amber-800">
                  {new Date(p.date_partie).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                </p>
                <p className="text-xs text-gray-400">{new Date(p.date_partie).getFullYear()}</p>
              </div>
              <div className="flex-1 min-w-0">
                {p.jeux ? (
                  <Link href={`/jeu/${p.jeux.slug}`} className="font-bold text-gray-900 hover:text-amber-800 text-sm leading-tight">
                    {p.jeux.nom}
                  </Link>
                ) : (
                  <p className="font-bold text-gray-400 text-sm">Jeu non spécifié</p>
                )}
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                  <span className="text-xs text-gray-400">👥 {p.joueurs.length} joueur{p.joueurs.length !== 1 ? "s" : ""}</span>
                  {p.duree_minutes && <span className="text-xs text-gray-400">⏱ {p.duree_minutes} min</span>}
                  {p.gagnant_id && <span className="text-xs text-amber-700 font-semibold">🏆 Gagnant enregistré</span>}
                </div>
                {p.notes && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{p.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
