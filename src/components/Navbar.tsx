"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";

export interface MenuGroup {
  label: string;
  slug: string;
  items: { nom: string; slug: string }[];
}

interface Props {
  menuGroups: MenuGroup[];
}

export default function Navbar({ menuGroups }: Props) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  return (
    <header className="bg-amber-800 text-white shadow-lg relative z-50">
      {/* Barre principale */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-bold hover:text-amber-200 transition-colors shrink-0"
            onClick={() => setActiveMenu(null)}
          >
            <span className="text-2xl">🎲</span>
            <span className="hidden sm:inline">Lokidia Games</span>
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
                      {/* Triangle décoratif */}
                      <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-t border-l border-amber-100 rotate-45" />
                      <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-3 px-1 border-b border-amber-100 pb-2">
                        {menu.label}
                      </p>
                      <ul className="flex flex-col gap-0.5">
                        {/* Link to the root category itself */}
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
          <div className="flex items-center gap-3">
            <Link
              href="/chatbot"
              className="hidden sm:flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors"
            >
              💬 <span className="hidden md:inline">IA</span>
            </Link>

            {/* Hamburger mobile */}
            <button
              className="lg:hidden p-2 rounded-md hover:bg-amber-700 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
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
