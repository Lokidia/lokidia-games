"use client";

import { useState, useEffect } from "react";

type NotifState = "unknown" | "granted" | "denied" | "default" | "unsupported";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

export default function SectionNotifications() {
  const [state, setState]     = useState<NotifState>("unknown");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg]         = useState("");

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setState("unsupported");
    } else {
      setState(Notification.permission as NotifState);
    }
  }, []);

  const subscribe = async () => {
    setLoading(true);
    setMsg("");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState("denied");
        setMsg("Vous avez refusé les notifications.");
        setLoading(false);
        return;
      }
      setState("granted");
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      if (existing) await existing.unsubscribe();
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!) as unknown as ArrayBuffer,
      });
      const res = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!res.ok) throw new Error("Erreur serveur");
      setMsg("Notifications activées !");
    } catch (e) {
      setMsg(`Erreur : ${e instanceof Error ? e.message : String(e)}`);
    }
    setLoading(false);
  };

  const unsubscribe = async () => {
    setLoading(true);
    setMsg("");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/notifications/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setState("default");
      setMsg("Notifications désactivées.");
    } catch (e) {
      setMsg(`Erreur : ${e instanceof Error ? e.message : String(e)}`);
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-6 flex flex-col gap-5">
      {state === "unsupported" ? (
        <p className="text-gray-500 text-sm">Votre navigateur ne prend pas en charge les notifications push.</p>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full shrink-0 ${state === "granted" ? "bg-emerald-500" : "bg-gray-300"}`} />
            <span className="text-sm font-semibold text-gray-700">
              {state === "granted" ? "Notifications activées" :
               state === "denied"  ? "Notifications bloquées par le navigateur" :
                                     "Notifications désactivées"}
            </span>
          </div>

          {state === "denied" && (
            <p className="text-xs text-gray-500 bg-red-50 border border-red-100 rounded-xl p-3">
              Vous avez bloqué les notifications. Pour les réactiver, modifiez les permissions dans les paramètres de votre navigateur.
            </p>
          )}

          {state !== "denied" && state !== "granted" && (
            <button
              onClick={subscribe}
              disabled={loading}
              className="bg-amber-700 hover:bg-amber-800 disabled:opacity-60 text-white font-bold px-6 py-3 rounded-xl transition-colors"
            >
              {loading ? "Activation…" : "🔔 Activer les notifications"}
            </button>
          )}

          {state === "granted" && (
            <button
              onClick={unsubscribe}
              disabled={loading}
              className="border border-gray-200 hover:border-red-300 text-gray-600 hover:text-red-600 text-sm font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              {loading ? "Désactivation…" : "🔕 Désactiver les notifications"}
            </button>
          )}

          {msg && (
            <p className={`text-sm text-center font-medium ${msg.startsWith("Erreur") ? "text-red-600" : "text-emerald-700"}`}>
              {msg}
            </p>
          )}
        </>
      )}

      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs text-gray-400 font-semibold mb-2 uppercase tracking-wide">Vous serez notifié pour :</p>
        <ul className="text-sm text-gray-500 flex flex-col gap-2">
          <li className="flex items-start gap-2"><span className="mt-0.5">📚</span> Un ami ajoute un jeu à sa ludothèque</li>
          <li className="flex items-start gap-2"><span className="mt-0.5">👥</span> Vous recevez une demande d&apos;ami</li>
          <li className="flex items-start gap-2"><span className="mt-0.5">🎲</span> Un ami enregistre une partie avec vous</li>
        </ul>
      </div>
    </div>
  );
}
