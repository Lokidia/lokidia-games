"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

const RELATION_TYPES = [
  { value: "extension",       label: "Extension",        desc: "Ce jeu est une extension du jeu courant" },
  { value: "similaire",       label: "Similaire",        desc: "Jeu du même style / même ambiance" },
  { value: "reimplementation", label: "Réimplantation",  desc: "Nouvelle version ou adaptation" },
] as const;

type RelationType = typeof RELATION_TYPES[number]["value"];

interface RelatedGame {
  id: string;
  slug: string;
  nom: string;
  image_url: string | null;
  note: number;
  complexite: string;
}

interface Relation {
  id: string;
  type: RelationType;
  jeu_lie: RelatedGame;
}

interface SearchResult {
  slug: string;
  nom: string;
  note: number;
  image_url: string | null;
  complexite: string | null;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const TYPE_COLORS: Record<RelationType, string> = {
  extension:       "bg-blue-100 text-blue-700",
  similaire:       "bg-purple-100 text-purple-700",
  reimplementation: "bg-orange-100 text-orange-700",
};

const TYPE_LABELS: Record<RelationType, string> = {
  extension:       "Extension",
  similaire:       "Similaire",
  reimplementation: "Réimplantation",
};

export default function RelationsPanel({ jeuSlug }: { jeuSlug: string }) {
  const [relations, setRelations] = useState<Relation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  // Search state
  const [searchQ, setSearchQ]     = useState("");
  const [results, setResults]     = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [dropOpen, setDropOpen]   = useState(false);
  const [selType, setSelType]     = useState<RelationType>("similaire");
  const [adding, setAdding]       = useState(false);
  const [addError, setAddError]   = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debouncedQ = useDebounce(searchQ, 280);

  // Load existing relations
  useEffect(() => {
    fetch(`/api/admin/jeux/${jeuSlug}/relations`)
      .then((r) => r.json())
      .then((d) => { setRelations(d as Relation[]); setLoading(false); })
      .catch(() => { setError("Impossible de charger les relations"); setLoading(false); });
  }, [jeuSlug]);

  // Search games
  useEffect(() => {
    if (debouncedQ.length < 2) { setResults([]); setDropOpen(false); return; }
    setSearching(true);
    fetch(`/api/search?q=${encodeURIComponent(debouncedQ)}`)
      .then((r) => r.json())
      .then((d) => { setResults(d as SearchResult[]); setDropOpen(true); })
      .catch(() => setResults([]))
      .finally(() => setSearching(false));
  }, [debouncedQ]);

  // Close dropdown on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setDropOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  async function addRelation(linked: SearchResult) {
    setAdding(true);
    setAddError(null);
    setDropOpen(false);
    setSearchQ("");
    setResults([]);
    try {
      const res = await fetch(`/api/admin/jeux/${jeuSlug}/relations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jeu_lie_slug: linked.slug, type: selType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setRelations((prev) => [...prev, data as Relation]);
    } catch (e) {
      setAddError(e instanceof Error ? e.message : String(e));
    } finally {
      setAdding(false);
    }
  }

  async function deleteRelation(id: string) {
    const res = await fetch(`/api/admin/jeux/${jeuSlug}/relations/${id}`, { method: "DELETE" });
    if (res.ok) setRelations((prev) => prev.filter((r) => r.id !== id));
  }

  // Group by type for display
  const grouped = RELATION_TYPES.map(({ value, label }) => ({
    type: value,
    label,
    items: relations.filter((r) => r.type === value),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="border-t border-amber-100 pt-6 mt-6 space-y-5">
      <h3 className="text-base font-bold text-amber-900">Relations avec d&apos;autres jeux</h3>

      {/* Add relation */}
      <div className="bg-amber-50 rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Associer un jeu</p>

        {/* Type selector */}
        <div className="flex flex-wrap gap-2">
          {RELATION_TYPES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setSelType(value)}
              className={`px-3 py-1 text-xs font-semibold rounded-full border transition-colors ${
                selType === value
                  ? "bg-amber-700 text-white border-amber-700"
                  : "bg-white text-gray-600 border-gray-200 hover:border-amber-400"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search input + dropdown */}
        <div ref={wrapperRef} className="relative">
          <input
            type="text"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            onFocus={() => { if (results.length > 0) setDropOpen(true); }}
            placeholder="Rechercher un jeu à associer…"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            disabled={adding}
          />
          {searching && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">…</span>
          )}

          {dropOpen && results.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-amber-100 z-50 overflow-hidden max-h-56 overflow-y-auto">
              {results
                .filter((r) => r.slug !== jeuSlug)
                .map((r) => (
                  <button
                    key={r.slug}
                    type="button"
                    onClick={() => addRelation(r)}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-amber-50 text-left transition-colors"
                  >
                    <div className="w-8 h-8 rounded bg-amber-100 shrink-0 relative overflow-hidden">
                      {r.image_url ? (
                        <Image src={r.image_url} alt={r.nom} fill className="object-cover" unoptimized />
                      ) : (
                        <span className="flex items-center justify-center h-full text-sm">🎲</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{r.nom}</p>
                      {r.complexite && <p className="text-xs text-gray-400">{r.complexite}</p>}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${TYPE_COLORS[selType]}`}>
                      {TYPE_LABELS[selType]}
                    </span>
                  </button>
                ))}
            </div>
          )}
        </div>

        {addError && <p className="text-xs text-red-500">⚠ {addError}</p>}
        {adding && <p className="text-xs text-amber-600">Ajout en cours…</p>}
      </div>

      {/* Existing relations */}
      {loading && <p className="text-sm text-gray-400">Chargement…</p>}
      {error && <p className="text-sm text-red-500">⚠ {error}</p>}

      {!loading && relations.length === 0 && (
        <p className="text-sm text-gray-400 italic">Aucune relation pour l&apos;instant.</p>
      )}

      {grouped.map(({ type, label, items }) => (
        <div key={type}>
          <p className={`text-xs font-bold uppercase tracking-wide px-2 py-1 rounded-full inline-block mb-2 ${TYPE_COLORS[type as RelationType]}`}>
            {label} ({items.length})
          </p>
          <div className="space-y-2">
            {items.map((rel) => (
              <div key={rel.id} className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-3 py-2">
                <div className="w-8 h-8 rounded bg-amber-100 shrink-0 relative overflow-hidden">
                  {rel.jeu_lie.image_url ? (
                    <Image src={rel.jeu_lie.image_url} alt={rel.jeu_lie.nom} fill className="object-cover" unoptimized />
                  ) : (
                    <span className="flex items-center justify-center h-full text-sm">🎲</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{rel.jeu_lie.nom}</p>
                  {rel.jeu_lie.complexite && (
                    <p className="text-xs text-gray-400">{rel.jeu_lie.complexite}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => deleteRelation(rel.id)}
                  className="text-gray-300 hover:text-red-500 transition-colors p-1 rounded"
                  title="Supprimer cette relation"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
