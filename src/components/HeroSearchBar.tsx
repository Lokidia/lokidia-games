"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

interface SearchResult {
  slug: string;
  nom: string;
  note: number;
  image_url: string | null;
  complexite: string | null;
  description: string | null;
  match_label?: string | null;
  match_type?: string | null;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function HeroSearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const debouncedQuery = useDebounce(query, 280);

  // Fetch preview results
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      queueMicrotask(() => {
        setResults([]);
        setOpen(false);
      });
      return;
    }
    queueMicrotask(() => setLoading(true));
    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((r) => r.json())
      .then((data) => {
        setResults(data as SearchResult[]);
        setOpen(true);
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  // Close on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setOpen(false);
      router.push(`/jeux?q=${encodeURIComponent(query.trim())}`);
    }
  }, [query, router]);

  return (
    <div ref={wrapperRef} className="w-full max-w-2xl mx-auto relative">
      <form onSubmit={handleSubmit}>
        <div className="relative flex items-center">
          <div className="absolute left-4 text-amber-400">
            {loading ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { if (results.length > 0) setOpen(true); }}
            placeholder="Rechercher un jeu, un thème, une ambiance..."
            className="w-full pl-12 pr-36 py-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-amber-200/60 text-base focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white/15 transition-all"
            autoComplete="off"
          />
          <button
            type="submit"
            className="absolute right-2 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
          >
            Rechercher
          </button>
        </div>
      </form>

      {/* Dropdown preview */}
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-amber-100 overflow-hidden z-50">
          <ul>
            {results.map((r) => {
              const shortDesc = r.description
                ? r.description.slice(0, 90).trimEnd() + (r.description.length > 90 ? "…" : "")
                : null;
              return (
                <li key={r.slug}>
                  <Link
                    href={`/jeu/${r.slug}`}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-amber-50 transition-colors min-h-[60px]"
                  >
                    {/* Thumbnail */}
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-amber-100 shrink-0 relative mt-0.5">
                      {r.image_url ? (
                        <Image src={r.image_url} alt={r.nom} fill className="object-cover" unoptimized />
                      ) : (
                        <span className="flex items-center justify-center h-full text-lg">🎲</span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Name + badges on same line */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-gray-900 truncate">{r.nom}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {r.note > 0 && (
                            <span className="text-xs font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">
                              ⭐ {r.note}
                            </span>
                          )}
                          {r.complexite && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                              {r.complexite}
                            </span>
                          )}
                          {r.match_label && (
                            <span className="text-xs text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                              {r.match_label}
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Short description below */}
                      {shortDesc && (
                        <p className="text-xs text-gray-400 mt-0.5 leading-snug line-clamp-1">{shortDesc}</p>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link
            href={`/jeux?q=${encodeURIComponent(query)}`}
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-1 px-4 py-2.5 text-xs font-semibold text-amber-700 hover:bg-amber-50 border-t border-amber-100 transition-colors"
          >
            Voir tous les résultats pour &quot;{query}&quot; →
          </Link>
        </div>
      )}
    </div>
  );
}
