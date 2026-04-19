"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const COOKIE_NAME = "cookie-consent";
const COOKIE_DAYS = 365;

function getCookieValue(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function persistCookie(value: string) {
  const expires = new Date(Date.now() + COOKIE_DAYS * 864e5).toUTCString();
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!getCookieValue()) setVisible(true);
  }, []);

  function accept() {
    persistCookie("accepted");
    setVisible(false);
  }

  function refuse() {
    persistCookie("refused");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-stone-950 border-t border-stone-800 shadow-2xl">
      <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-sm text-stone-300 leading-relaxed flex-1">
          🍪 Ce site utilise des cookies techniques nécessaires à son fonctionnement.
          Aucune donnée personnelle n&apos;est collectée sans votre consentement.{" "}
          <Link href="/confidentialite" className="underline text-amber-400 hover:text-amber-300 transition-colors">
            En savoir plus
          </Link>
        </p>
        <div className="flex gap-3 shrink-0">
          <button
            onClick={refuse}
            className="px-4 py-2 text-sm font-semibold text-stone-300 border border-stone-600 hover:border-stone-400 rounded-xl transition-colors"
          >
            Refuser
          </button>
          <button
            onClick={accept}
            className="px-4 py-2 text-sm font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-xl transition-colors"
          >
            Tout accepter
          </button>
        </div>
      </div>
    </div>
  );
}
