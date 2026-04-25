"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import NavbarUserMenu from "./NavbarUserMenu";

export interface MenuGroup {
  label: string;
  slug: string;
  items: { nom: string; slug: string }[];
}

interface Props {
  menuGroups: MenuGroup[];
}

interface SearchResult {
  slug: string;
  nom: string;
  note: number;
  image_url: string | null;
  complexite: string | null;
  description: string | null;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

function LokidiaIcon() {
  return (
    <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 shrink-0">
      {/* Die body */}
      <rect width="36" height="36" rx="9" fill="#b45309" />
      <rect width="36" height="36" rx="9" fill="url(#lokg)" opacity="0.6" />
      {/* Die dots */}
      <circle cx="10" cy="10" r="2.2" fill="white" fillOpacity="0.45" />
      <circle cx="18" cy="18" r="2.2" fill="white" fillOpacity="0.25" />
      <circle cx="26" cy="26" r="2.2" fill="white" fillOpacity="0.45" />
      {/* LG letters */}
      <text
        x="18" y="24"
        textAnchor="middle"
        fill="white"
        fontSize="13"
        fontWeight="800"
        fontFamily="system-ui,-apple-system,sans-serif"
        letterSpacing="-0.5"
      >
        LG
      </text>
      <defs>
        <linearGradient id="lokg" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fbbf24" />
          <stop offset="1" stopColor="#78350f" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function Navbar({ menuGroups }: Props) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Search state
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const searchWrapperRef = useRef<HTMLDivElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const debouncedQuery = useDebounce(query, 280);

  const openMenu = useCallback((label: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setActiveMenu(label);
  }, []);

  const scheduleClose = useCallback(() => {
    closeTimer.current = setTimeout(() => setActiveMenu(null), 120);
  }, []);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  // Fetch search results
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      setDropdownOpen(false);
      return;
    }
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((r) => r.json())
      .then((data) => {
        setResults(data as SearchResult[]);
        setDropdownOpen(true);
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  // Close dropdowns on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setSearchFocused(false);
      }
}
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  // Focus mobile input when opened
  useEffect(() => {
    if (mobileSearchOpen) {
      setTimeout(() => mobileInputRef.current?.focus(), 50);
    }
  }, [mobileSearchOpen]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setDropdownOpen(false);
      setSearchFocused(false);
      setMobileSearchOpen(false);
      router.push(`/jeux?q=${encodeURIComponent(query.trim())}`);
    }
  }, [query, router]);

  const resetSearch = () => {
    setQuery("");
    setResults([]);
    setDropdownOpen(false);
  };

  const SearchDropdown = ({ align = "right" }: { align?: "right" | "left" }) => (
    dropdownOpen && results.length > 0 ? (
      <div className={`absolute top-full ${align === "right" ? "right-0" : "left-0"} mt-2 w-80 bg-white rounded-xl shadow-2xl border border-amber-100 overflow-hidden z-[200]`}>
        <ul>
          {results.map((r) => (
            <li key={r.slug}>
              <Link
                href={`/jeu/${r.slug}`}
                onClick={() => { setDropdownOpen(false); resetSearch(); }}
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-amber-50 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg overflow-hidden bg-amber-100 shrink-0 relative">
                  {r.image_url ? (
                    <Image src={r.image_url} alt={r.nom} fill className="object-cover" unoptimized />
                  ) : (
                    <span className="flex items-center justify-center h-full text-base">🎲</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-sm text-gray-900 truncate">{r.nom}</span>
                    {r.note > 0 && (
                      <span className="text-xs font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full shrink-0">
                        ⭐ {r.note}
                      </span>
                    )}
                  </div>
                  {r.complexite && (
                    <span className="text-xs text-gray-400">{r.complexite}</span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href={`/jeux?q=${encodeURIComponent(query)}`}
          onClick={() => { setDropdownOpen(false); resetSearch(); }}
          className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50 border-t border-amber-100 transition-colors"
        >
          Voir tous les résultats pour &quot;{query}&quot; →
        </Link>
      </div>
    ) : null
  );

  return (
    <header className="bg-amber-800 text-white shadow-lg relative z-50">
      {/* Barre principale */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 hover:opacity-90 transition-opacity shrink-0"
            onClick={() => setActiveMenu(null)}
          >
            <LokidiaIcon />
            <span className="hidden sm:flex flex-col leading-none">
              <span className="text-[15px] font-black tracking-tight text-white">Lokidia</span>
              <span className="text-[10px] font-bold tracking-widest text-amber-300 uppercase">Games</span>
            </span>
          </Link>

          {/* Menu desktop */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {menuGroups.map((menu) => (
              <div
                key={menu.slug}
                className="relative shrink-0"
                onMouseEnter={() => openMenu(menu.slug)}
                onMouseLeave={scheduleClose}
              >
                <button
                  className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                    activeMenu === menu.slug
                      ? "bg-amber-700 text-white"
                      : "hover:bg-amber-700 text-amber-100 hover:text-white"
                  }`}
                >
                  {menu.label}
                  {menu.items.length > 0 && (
                    <svg
                      className={`w-3 h-3 transition-transform ${activeMenu === menu.slug ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>

                {/* Panneau méga-menu */}
                {activeMenu === menu.slug && menu.items.length > 0 && (
                  <div
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-0 pt-2 z-[100]"
                    onMouseEnter={cancelClose}
                    onMouseLeave={scheduleClose}
                  >
                    <div className="bg-white text-gray-800 rounded-xl shadow-2xl border border-amber-100 p-4 min-w-[200px]">
                      <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-t border-l border-amber-100 rotate-45" />
                      <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-3 px-1 border-b border-amber-100 pb-2">
                        {menu.label}
                      </p>
                      <ul className="flex flex-col gap-0.5">
                        <li>
                          <Link
                            href={`/jeux/categorie/${menu.slug}`}
                            className="block px-3 py-1.5 text-sm rounded-lg hover:bg-amber-50 hover:text-amber-800 transition-colors font-semibold text-amber-700"
                            onClick={() => setActiveMenu(null)}
                          >
                            Tous — {menu.label}
                          </Link>
                        </li>
                        {menu.items.map((item) => (
                          <li key={item.slug}>
                            <Link
                              href={`/jeux/categorie/${item.slug}`}
                              className="block px-3 py-2 text-sm rounded-lg hover:bg-amber-50 hover:text-amber-800 transition-colors"
                              onClick={() => setActiveMenu(null)}
                            >
                              {item.nom}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Actions droite */}
          <div className="flex items-center gap-2">

            {/* ── Barre de recherche desktop ── */}
            <div ref={searchWrapperRef} className="hidden lg:block relative">
              <form onSubmit={handleSubmit}>
                <div className={`relative flex items-center transition-all duration-200 ease-in-out ${searchFocused ? "w-60" : "w-40"}`}>
                  <div className="absolute left-3 text-amber-300 pointer-events-none">
                    {loading ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                    ) : (
                      <SearchIcon className="w-4 h-4" />
                    )}
                  </div>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => {
                      setSearchFocused(true);
                      if (results.length > 0) setDropdownOpen(true);
                    }}
                    onBlur={() => { if (!query) setSearchFocused(false); }}
                    placeholder="Rechercher un jeu..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-amber-700/70 border border-amber-600 text-white placeholder-amber-300/70 text-sm focus:outline-none focus:ring-1 focus:ring-amber-300 focus:bg-amber-700 transition-all"
                    autoComplete="off"
                  />
                </div>
              </form>
              <SearchDropdown align="right" />
            </div>

            {/* ── Auth (client-only pour éviter hydration mismatch) ── */}
            <NavbarUserMenu />

            {/* ── Scanner mobile ── */}
            <Link
              href="/scanner"
              className="lg:hidden p-2 rounded-md hover:bg-amber-700 transition-colors text-amber-100"
              aria-label="Scanner un jeu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9V6a1 1 0 011-1h3M3 15v3a1 1 0 001 1h3m11-4v3a1 1 0 01-1 1h-3m4-11h-3a1 1 0 00-1 1v3M9 3v2m0 14v2m6-16v2m0 14v2M9 9h6v6H9z" />
              </svg>
            </Link>

            {/* ── Loupe mobile ── */}
            <button
              className="lg:hidden p-2 rounded-md hover:bg-amber-700 transition-colors text-amber-100"
              onClick={() => {
                setMobileSearchOpen(!mobileSearchOpen);
                setMobileOpen(false);
              }}
              aria-label="Rechercher"
            >
              <SearchIcon className="w-5 h-5" />
            </button>

            {/* Hamburger mobile */}
            <button
              className="lg:hidden p-2 rounded-md hover:bg-amber-700 transition-colors"
              onClick={() => {
                setMobileOpen(!mobileOpen);
                setMobileSearchOpen(false);
              }}
              aria-label="Menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── Barre de recherche mobile (pleine largeur) ── */}
      {mobileSearchOpen && (
        <div className="lg:hidden border-t border-amber-700 bg-amber-900 px-4 py-3">
          <div ref={searchWrapperRef} className="relative">
            <form onSubmit={handleSubmit}>
              <div className="relative flex items-center">
                <div className="absolute left-3 text-amber-300 pointer-events-none">
                  {loading ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  ) : (
                    <SearchIcon className="w-4 h-4" />
                  )}
                </div>
                <input
                  ref={mobileInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => { if (results.length > 0) setDropdownOpen(true); }}
                  placeholder="Rechercher un jeu..."
                  className="w-full pl-9 pr-4 py-2 rounded-lg bg-amber-800 border border-amber-600 text-white placeholder-amber-300/70 text-sm focus:outline-none focus:ring-1 focus:ring-amber-300 transition-all"
                  autoComplete="off"
                />
              </div>
            </form>
            <SearchDropdown align="left" />
          </div>
        </div>
      )}

      {/* Menu mobile */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-amber-700 bg-amber-800 max-h-[70vh] overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-1">
            <Link
              href="/"
              className="px-3 py-2 text-sm font-medium hover:bg-amber-700 rounded-lg"
              onClick={() => setMobileOpen(false)}
            >
              Accueil
            </Link>
            <Link
              href="/jeux"
              className="px-3 py-2 text-sm font-medium hover:bg-amber-700 rounded-lg"
              onClick={() => setMobileOpen(false)}
            >
              Tous les jeux
            </Link>
            {menuGroups.map((menu) => (
              <div key={menu.slug}>
                <Link
                  href={`/jeux/categorie/${menu.slug}`}
                  className="px-3 py-1.5 text-xs font-bold text-amber-300 uppercase tracking-wide mt-2 block hover:text-amber-100"
                  onClick={() => setMobileOpen(false)}
                >
                  {menu.label}
                </Link>
                {menu.items.length > 0 && (
                  <div className="grid grid-cols-2 gap-1 pl-2">
                    {menu.items.map((item) => (
                      <Link
                        key={item.slug}
                        href={`/jeux/categorie/${item.slug}`}
                        className="px-2 py-1.5 text-xs text-amber-100 hover:bg-amber-700 rounded-md"
                        onClick={() => setMobileOpen(false)}
                      >
                        {item.nom}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
