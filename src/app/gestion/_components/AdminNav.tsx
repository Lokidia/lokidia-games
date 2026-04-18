"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/gestion",               label: "Dashboard",      icon: "📊", exact: true },
  { href: "/gestion/jeux",          label: "Jeux",           icon: "🎲" },
  { href: "/gestion/categories",    label: "Catégories",     icon: "🗂️" },
  { href: "/gestion/associations",  label: "Associations",   icon: "🔗" },
  { href: "/gestion/enrichissement",label: "Enrichissement", icon: "✅" },
  { href: "/gestion/seo",           label: "SEO",            icon: "🔍" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <aside className="w-52 shrink-0 bg-amber-950 min-h-screen flex flex-col sticky top-0 h-screen">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-amber-800/50">
        <p className="text-amber-400 text-xs font-bold uppercase tracking-widest">Lokidia</p>
        <p className="text-white font-black text-xl leading-tight">Admin</p>
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-4 flex flex-col gap-0.5 px-2 overflow-y-auto">
        {LINKS.map(({ href, label, icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? "bg-amber-700 text-white"
                  : "text-amber-200/70 hover:bg-amber-800/50 hover:text-amber-100"
              }`}
            >
              <span className="text-base">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-amber-800/50 space-y-2">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs text-amber-400/60 hover:text-amber-400 transition-colors"
        >
          <span>←</span> Retour au site
        </Link>
        <form action="/api/gestion/logout" method="POST">
          <button
            type="submit"
            className="flex items-center gap-2 text-xs text-amber-400/60 hover:text-red-400 transition-colors w-full text-left"
          >
            <span>🔓</span> Déconnexion
          </button>
        </form>
      </div>
    </aside>
  );
}
