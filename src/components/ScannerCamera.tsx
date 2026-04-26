"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

type ScanState = "idle" | "scanning" | "found" | "not_found" | "error";

interface FoundGame {
  slug: string;
  nom: string;
  image_url: string | null;
  note: number;
  inactif?: boolean;
}

export default function ScannerCamera() {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const router    = useRouter();
  const [state, setState]   = useState<ScanState>("idle");
  const [ean, setEan]       = useState<string | null>(null);
  const [game, setGame]     = useState<FoundGame | null>(null);
  const [errMsg, setErrMsg] = useState("");
  const stopRef  = useRef<(() => void) | null>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);

  const lookup = useCallback(async (code: string) => {
    stopRef.current?.();
    setEan(code);
    const res = await fetch(`/api/scanner/lookup?ean=${encodeURIComponent(code)}`);
    const data = await res.json() as { found: boolean; inactif?: boolean; jeu?: FoundGame };
    if (data.found && data.jeu) {
      setGame({ ...data.jeu, inactif: data.inactif });
      setState("found");
      // Auto-redirect only for active games
      if (!data.inactif) {
        setTimeout(() => router.push(`/jeu/${data.jeu!.slug}`), 2000);
      }
    } else {
      setState("not_found");
    }
  }, [router]);

  // Tap-to-focus: single-shot refocus at screen centre, then restore continuous.
  const tapToFocus = useCallback(async () => {
    const track = trackRef.current;
    if (!track) return;
    try {
      await track.applyConstraints({
        advanced: [{ focusMode: "single-shot", pointOfInterest: { x: 0.5, y: 0.5 } }],
      } as unknown as MediaTrackConstraints);
      // Restore continuous autofocus after the single-shot settles (~600 ms).
      setTimeout(async () => {
        try {
          await track.applyConstraints({
            advanced: [{ focusMode: "continuous" }],
          } as unknown as MediaTrackConstraints);
        } catch { /* no-op */ }
      }, 600);
    } catch { /* focusMode/pointOfInterest unsupported — no-op */ }
  }, []);

  const startScanning = useCallback(async () => {
    setState("scanning");
    setEan(null);
    setGame(null);
    setErrMsg("");
    try {
      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      const reader = new BrowserMultiFormatReader();

      // Acquire stream with a three-step fallback so desktop and unusual devices
      // still work even when exact rear-camera or focus constraints are rejected.
      let stream: MediaStream;
      try {
        // Best case: exact rear camera, high-res, autofocus, torch off.
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width:      { ideal: 1920 },
            height:     { ideal: 1080 },
            facingMode: { exact: "environment" },
            focusMode:  "continuous",
            torch:      false,
            advanced:   [{ focusMode: "continuous", torch: false }],
          } as unknown as MediaTrackConstraints,
        });
      } catch {
        try {
          // Preferred rear camera but not mandatory, no focus/torch constraints.
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "environment" },
          });
        } catch {
          // Last resort: accept any camera (desktop, front-only device).
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        }
      }

      // Apply continuous autofocus to the live track; silently ignored if unsupported.
      const track = stream.getVideoTracks()[0] ?? null;
      trackRef.current = track;
      if (track) {
        try {
          await track.applyConstraints({
            advanced: [{ focusMode: "continuous" }],
          } as unknown as MediaTrackConstraints);
        } catch { /* no-op */ }
      }

      // Hand the stream to zxing; it sets video.srcObject and starts playback.
      const controls = await reader.decodeFromStream(
        stream,
        videoRef.current!,
        (result: unknown, _err: unknown) => {
          if (result && typeof (result as { getText?: unknown }).getText === "function") {
            lookup((result as { getText(): string }).getText());
          }
        }
      );

      stopRef.current = () => {
        controls.stop();
        stream.getTracks().forEach(t => t.stop());
        trackRef.current = null;
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.toLowerCase().includes("permission") || msg.toLowerCase().includes("denied")) {
        setErrMsg("Accès à la caméra refusé. Autorisez l'accès dans les paramètres du navigateur.");
      } else {
        setErrMsg(`Erreur caméra : ${msg}`);
      }
      setState("error");
    }
  }, [lookup]);

  // Cleanup on unmount
  useEffect(() => () => { stopRef.current?.(); }, []);

  const reset = () => {
    stopRef.current?.();
    setState("idle");
    setEan(null);
    setGame(null);
  };

  return (
    <div className="flex flex-col items-center gap-6">

      {/* Viewfinder */}
      <div
        className={`relative w-full max-w-sm aspect-[3/4] bg-gray-900 rounded-2xl overflow-hidden shadow-2xl ${state === "scanning" ? "cursor-pointer active:brightness-75 transition-[filter]" : ""}`}
        onClick={state === "scanning" ? tapToFocus : undefined}
      >
        <video
          ref={videoRef}
          className={`w-full h-full object-cover ${state === "scanning" ? "opacity-100" : "opacity-30"}`}
          playsInline
          muted
        />

        {/* Scan frame overlay */}
        {state === "scanning" && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-40 relative">
              {/* Corner marks */}
              {[
                "top-0 left-0 border-t-4 border-l-4 rounded-tl-lg",
                "top-0 right-0 border-t-4 border-r-4 rounded-tr-lg",
                "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-lg",
                "bottom-0 right-0 border-b-4 border-r-4 rounded-br-lg",
              ].map((cls) => (
                <div key={cls} className={`absolute w-8 h-8 border-amber-400 ${cls}`} />
              ))}
              {/* Scan line */}
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-amber-400/80 animate-pulse" />
            </div>
            <p className="absolute bottom-6 text-white/70 text-sm">Pointez vers le code-barres</p>
          </div>
        )}

        {/* Result overlay */}
        {state === "found" && game && (
          <div className={`absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center ${game.inactif ? "bg-amber-900/90" : "bg-emerald-900/90"}`}>
            {game.image_url && (
              <div className="relative w-20 h-20 rounded-xl overflow-hidden shadow-lg">
                <Image src={game.image_url} alt={game.nom} fill className="object-cover" unoptimized />
              </div>
            )}
            <p className="text-2xl">{game.inactif ? "🔍" : "✅"}</p>
            <p className="text-white font-bold text-lg leading-tight">{game.nom}</p>
            {game.inactif
              ? <p className="text-amber-300 text-xs">Fiche en cours de mise à jour</p>
              : <p className="text-emerald-300 text-sm">Redirection en cours…</p>
            }
          </div>
        )}

        {state === "idle" && (
          <div className="absolute inset-0 flex items-center justify-center flex-col gap-3 text-center p-6">
            <span className="text-6xl">📷</span>
            <p className="text-white/60 text-sm">Appuyez sur Scanner pour démarrer</p>
          </div>
        )}
      </div>

      {/* Tap-to-focus hint */}
      {state === "scanning" && (
        <p className="text-xs text-gray-400 text-center -mt-2">
          Appuyez sur l&apos;image pour faire la mise au point
        </p>
      )}

      {/* Actions */}
      {state === "idle" && (
        <button
          onClick={startScanning}
          className="bg-amber-700 hover:bg-amber-800 text-white font-bold px-8 py-3 rounded-xl text-lg transition-colors shadow-lg"
        >
          📷 Scanner un jeu
        </button>
      )}

      {state === "scanning" && (
        <button
          onClick={reset}
          className="text-sm text-gray-500 hover:text-red-600 border border-gray-200 px-4 py-2 rounded-lg transition-colors"
        >
          Annuler
        </button>
      )}

      {state === "found" && game && (
        <div className="flex flex-col items-center gap-2">
          <div className="flex gap-3">
            <Link
              href={`/jeu/${game.slug}`}
              className="bg-amber-700 hover:bg-amber-800 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors"
            >
              Voir la fiche →
            </Link>
            <button onClick={reset} className="text-sm text-gray-500 border border-gray-200 px-4 py-2 rounded-lg hover:border-amber-300">
              Scanner un autre
            </button>
          </div>
          {game.inactif && (
            <p className="text-xs text-gray-400 italic">Fiche en cours de mise à jour</p>
          )}
        </div>
      )}

      {state === "not_found" && ean && (
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-gray-600 text-sm">Code-barres <code className="bg-gray-100 px-2 py-0.5 rounded font-mono">{ean}</code> non trouvé.</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <a
              href={`https://www.amazon.fr/s?k=${encodeURIComponent(ean)}&tag=lokidia21-21`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-amber-700 hover:bg-amber-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              🛒 Rechercher sur Amazon
            </a>
            <Link
              href={`/jeux?q=${encodeURIComponent(ean)}`}
              className="border border-amber-300 text-amber-800 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-amber-50 transition-colors"
            >
              Chercher dans le catalogue
            </Link>
            <button onClick={reset} className="text-sm text-gray-500 border border-gray-200 px-4 py-2 rounded-lg">
              Réessayer
            </button>
          </div>
        </div>
      )}

      {state === "error" && (
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-red-600 text-sm">{errMsg}</p>
          <button onClick={reset} className="text-sm border border-gray-200 px-4 py-2 rounded-lg hover:border-amber-300">
            Réessayer
          </button>
        </div>
      )}
    </div>
  );
}
