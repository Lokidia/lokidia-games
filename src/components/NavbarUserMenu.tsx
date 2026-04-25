"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

interface NavUser {
  pseudo: string | null;
}

export default function NavbarUserMenu() {
  const [user, setUser] = useState<NavUser | null | undefined>(undefined); // undefined = loading
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sb = createClient();
    sb.auth.getUser().then(async ({ data: { user: u } }) => {
      if (!u) { setUser(null); return; }
      const { data: profile } = await sb
        .from("profiles")
        .select("pseudo")
        .eq("id", u.id)
        .single();
      setUser({ pseudo: (profile as { pseudo: string | null } | null)?.pseudo ?? null });
    });

    // Keep in sync with auth changes (login/logout in other tabs)
    const { data: { subscription } } = sb.auth.onAuthStateChange(() => {
      sb.auth.getUser().then(async ({ data: { user: u } }) => {
        if (!u) { setUser(null); return; }
        const { data: profile } = await sb
          .from("profiles")
          .select("pseudo")
          .eq("id", u.id)
          .single();
        setUser({ pseudo: (profile as { pseudo: string | null } | null)?.pseudo ?? null });
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  // Close on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Still loading → render nothing so SSR and first paint match
  if (user === undefined) return null;

  if (!user) {
    return (
      <Link
        href="/connexion"
        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-sm font-semibold text-white transition-colors"
      >
        Connexion
      </Link>
    );
  }

  const initial = (user.pseudo ?? "?")[0].toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-700/60 hover:bg-amber-700 transition-colors text-sm font-semibold text-white"
      >
        <span className="w-6 h-6 rounded-full bg-amber-400 text-amber-950 text-xs font-black flex items-center justify-center shrink-0">
          {initial}
        </span>
        <span className="hidden sm:inline max-w-[96px] truncate">{user.pseudo ?? "Profil"}</span>
        <svg
          className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-2xl border border-amber-100 overflow-hidden z-[200] py-1">
          <Link href="/profil" onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-amber-50 transition-colors">
            👤 Mon profil
          </Link>
          <Link href="/profil" onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-amber-50 transition-colors">
            📚 Ma ludothèque
          </Link>
          <div className="border-t border-gray-100 mt-1 pt-1">
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                🚪 Déconnexion
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
