"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

type Statut = "possede" | "souhaite";

const BUTTONS: { statut: Statut; label: string; activeClass: string }[] = [
  { statut: "possede",  label: "📚 J'ai ce jeu", activeClass: "bg-amber-700 text-white border-amber-700" },
  { statut: "souhaite", label: "❤️ Je le veux",  activeClass: "bg-rose-600 text-white border-rose-600" },
];

export default function LudothequeButtons({ jeuId }: { jeuId: string }) {
  const [userId, setUserId]           = useState<string | null>(null);
  const [actifs, setActifs]           = useState<Set<Statut>>(new Set());
  const [loading, setLoading]         = useState(true);
  const [pending, setPending]         = useState<Statut | null>(null);

  // Load current user and their statuts for this game
  useEffect(() => {
    const sb = createClient();
    sb.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return; }
      setUserId(user.id);
      sb.from("ludotheque")
        .select("statut")
        .eq("user_id", user.id)
        .eq("jeu_id", jeuId)
        .then(({ data }) => {
          setActifs(new Set((data ?? []).map((r: { statut: string }) => r.statut as Statut)));
          setLoading(false);
        });
    });
  }, [jeuId]);

  const toggle = useCallback(async (statut: Statut) => {
    if (!userId || pending) return;
    setPending(statut);
    const sb = createClient();

    if (actifs.has(statut)) {
      await sb.from("ludotheque").delete()
        .eq("user_id", userId).eq("jeu_id", jeuId).eq("statut", statut);
      setActifs((prev) => { const next = new Set(prev); next.delete(statut); return next; });
    } else {
      await sb.from("ludotheque").insert({ user_id: userId, jeu_id: jeuId, statut });
      setActifs((prev) => new Set([...prev, statut]));
    }
    setPending(null);
  }, [userId, jeuId, actifs, pending]);

  if (loading) return null;

  if (!userId) {
    return (
      <div className="flex flex-wrap gap-2 items-center">
        {BUTTONS.map(({ label }) => (
          <Link
            key={label}
            href="/connexion"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-400 hover:border-amber-400 hover:text-amber-700 transition-colors"
          >
            {label}
          </Link>
        ))}
        <span className="text-xs text-gray-400">— <Link href="/connexion" className="underline hover:text-amber-700">Connectez-vous</Link></span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {BUTTONS.map(({ statut, label, activeClass }) => {
        const isActive = actifs.has(statut);
        const isLoading = pending === statut;
        return (
          <button
            key={statut}
            onClick={() => toggle(statut)}
            disabled={!!pending}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-60 ${
              isActive
                ? activeClass
                : "border-gray-200 text-gray-600 hover:border-amber-400 hover:text-amber-700"
            }`}
          >
            {isLoading ? "…" : label}
          </button>
        );
      })}
    </div>
  );
}
