"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getConsent, hasConsented, saveConsent } from "@/lib/consent";

type View = "banner" | "modal" | null;

interface Prefs {
  analytics: boolean;
  marketing: boolean;
}

const CATEGORIES = [
  {
    id: "necessary" as const,
    label: "Strictement nécessaires",
    description: "Cookies indispensables au fonctionnement du site : session administrateur, préférences d'affichage, consentement. Ne peuvent pas être désactivés.",
    locked: true,
  },
  {
    id: "analytics" as const,
    label: "Analytiques",
    description: "Nous aident à comprendre comment les visiteurs utilisent le site (pages vues, durée de session). Aucune donnée personnelle identifiable.",
    locked: false,
  },
  {
    id: "marketing" as const,
    label: "Marketing",
    description: "Permettent de personnaliser les publicités et de mesurer leur efficacité. Actuellement non utilisés sur ce site.",
    locked: false,
  },
];

export default function CookieBanner() {
  const [view, setView] = useState<View>(null);
  const [prefs, setPrefs] = useState<Prefs>({ analytics: false, marketing: false });

  useEffect(() => {
    // Show banner on first visit
    if (!hasConsented()) setView("banner");

    // Load saved prefs for modal
    const saved = getConsent();
    if (saved) setPrefs({ analytics: saved.analytics, marketing: saved.marketing });

    // Listen for "open-consent-modal" event dispatched from Footer
    function onOpen() {
      const saved = getConsent();
      if (saved) setPrefs({ analytics: saved.analytics, marketing: saved.marketing });
      setView("modal");
    }
    window.addEventListener("open-consent-modal", onOpen);
    return () => window.removeEventListener("open-consent-modal", onOpen);
  }, []);

  function acceptAll() {
    saveConsent({ analytics: true, marketing: true });
    setView(null);
  }

  function refuseAll() {
    saveConsent({ analytics: false, marketing: false });
    setView(null);
  }

  function savePrefs() {
    saveConsent(prefs);
    setView(null);
  }

  if (!view) return null;

  return (
    <>
      {/* ── Modal préférences ── */}
      {view === "modal" && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col">
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-black text-gray-900">Gérer mes préférences de cookies</h2>
              <p className="text-sm text-gray-500 mt-1">
                Choisissez les catégories de cookies que vous autorisez.{" "}
                <Link href="/confidentialite" className="text-amber-600 hover:underline">
                  En savoir plus
                </Link>
              </p>
            </div>

            {/* Catégories */}
            <div className="px-6 py-4 flex flex-col divide-y divide-gray-100">
              {CATEGORIES.map((cat) => {
                const isOn = cat.locked || prefs[cat.id as keyof Prefs] === true;
                return (
                  <div key={cat.id} className="flex items-start gap-4 py-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{cat.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{cat.description}</p>
                    </div>
                    <div className="shrink-0 mt-0.5">
                      {cat.locked ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <button
                            disabled
                            className="relative inline-flex h-5 w-9 items-center rounded-full bg-emerald-500 opacity-60 cursor-not-allowed"
                            title="Toujours actif"
                          >
                            <span className="inline-block h-3.5 w-3.5 translate-x-4 rounded-full bg-white shadow" />
                          </button>
                          <span className="text-[10px] text-gray-400">Toujours actif</span>
                        </div>
                      ) : (
                        <button
                          onClick={() =>
                            setPrefs((p) => ({ ...p, [cat.id]: !p[cat.id as keyof Prefs] }))
                          }
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            prefs[cat.id as keyof Prefs] ? "bg-emerald-500" : "bg-gray-300"
                          }`}
                          title={isOn ? "Désactiver" : "Activer"}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                              prefs[cat.id as keyof Prefs] ? "translate-x-4" : "translate-x-1"
                            }`}
                          />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex flex-col sm:flex-row gap-2 justify-end">
              <button
                onClick={refuseAll}
                className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-300 hover:border-gray-400 rounded-xl transition-colors order-last sm:order-first"
              >
                Tout refuser
              </button>
              <button
                onClick={savePrefs}
                className="px-4 py-2 text-sm font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-xl transition-colors"
              >
                Enregistrer mes préférences
              </button>
              <button
                onClick={acceptAll}
                className="px-4 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors"
              >
                Tout accepter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bandeau initial (premier visit) ── */}
      {view === "banner" && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-stone-950 border-t border-stone-800 shadow-2xl">
          <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <p className="text-sm text-stone-300 leading-relaxed flex-1">
              🍪 Nous utilisons des cookies nécessaires au fonctionnement du site et, avec votre accord, des cookies analytiques pour améliorer votre expérience.{" "}
              <Link href="/confidentialite" className="underline text-amber-400 hover:text-amber-300 transition-colors">
                Politique de confidentialité
              </Link>
            </p>
            <div className="flex flex-wrap gap-2 shrink-0">
              <button
                onClick={() => setView("modal")}
                className="px-3 py-2 text-xs font-semibold text-stone-400 hover:text-stone-200 border border-stone-700 hover:border-stone-500 rounded-xl transition-colors"
              >
                Gérer mes préférences
              </button>
              <button
                onClick={refuseAll}
                className="px-3 py-2 text-xs font-semibold text-stone-300 border border-stone-600 hover:border-stone-400 rounded-xl transition-colors"
              >
                Refuser
              </button>
              <button
                onClick={acceptAll}
                className="px-3 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-xl transition-colors"
              >
                Tout accepter
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
