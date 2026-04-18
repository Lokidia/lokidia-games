"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HeroSearchBar() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/jeux?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <form onSubmit={handleSearch} className="w-full max-w-2xl mx-auto">
      <div className="relative flex items-center">
        <div className="absolute left-4 text-amber-400">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un jeu, un thème, une ambiance..."
          className="w-full pl-12 pr-36 py-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-amber-200/60 text-base focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white/15 transition-all"
        />
        <button
          type="submit"
          className="absolute right-2 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
        >
          Rechercher
        </button>
      </div>
    </form>
  );
}
