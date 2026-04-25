"use client";

import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!prompt || dismissed) return null;

  const handleInstall = async () => {
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setDismissed(true);
    setPrompt(null);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-amber-200 shadow-xl px-4 py-3 flex items-center gap-4 sm:px-6">
      <span className="text-2xl shrink-0">🎲</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 leading-tight">
          Installez Lokidia Games sur votre téléphone
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          Accès rapide depuis votre écran d&apos;accueil
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => setDismissed(true)}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors px-2 py-1"
        >
          Plus tard
        </button>
        <button
          onClick={handleInstall}
          className="bg-amber-700 hover:bg-amber-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          Installer
        </button>
      </div>
    </div>
  );
}
