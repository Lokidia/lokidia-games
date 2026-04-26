"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface Window {
    deferredInstallPrompt?: BeforeInstallPromptEvent;
  }
}

export default function PWAInstallButton({ className }: { className?: string }) {
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    // Pick up a prompt that was deferred before this component mounted
    if (window.deferredInstallPrompt) setCanInstall(true);

    const handler = (e: Event) => {
      e.preventDefault();
      window.deferredInstallPrompt = e as BeforeInstallPromptEvent;
      setCanInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    const prompt = window.deferredInstallPrompt;
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") {
      window.deferredInstallPrompt = undefined;
      setCanInstall(false);
    }
  }

  if (canInstall) {
    return (
      <button onClick={handleInstall} className={className}>
        📲 Installer l&apos;app →
      </button>
    );
  }

  // Fallback: link to scanner page when PWA already installed or not supported
  return (
    <Link href="/scanner" className={className}>
      📷 Scanner un jeu →
    </Link>
  );
}
