"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type Statut = "en_attente" | "accepte" | "refuse";

interface AmiRow {
  id: string;
  statut: Statut;
  user_id: string;
  ami_id: string;
  created_at: string;
  profiles_user: { pseudo: string | null } | null;
  profiles_ami:  { pseudo: string | null } | null;
}

export default function AmisPage() {
  const [meId, setMeId]         = useState<string | null>(null);
  const [rows, setRows]         = useState<AmiRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState("");
  const [inviteErr, setInviteErr] = useState("");

  const fetchAmis = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/amis");
    if (res.ok) {
      const data = await res.json() as { amis: AmiRow[] };
      setRows(data.amis);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Get current user id via profile fetch
    fetch("/api/amis").then(r => {
      if (r.status === 401) window.location.href = "/connexion";
    });
    fetchAmis();

    // Get me id from supabase client
    import("@/utils/supabase/client").then(({ createClient }) => {
      createClient().auth.getUser().then(({ data: { user } }) => setMeId(user?.id ?? null));
    });
  }, [fetchAmis]);

  const respond = async (id: string, statut: "accepte" | "refuse") => {
    await fetch(`/api/amis/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ statut }) });
    fetchAmis();
  };

  const remove = async (id: string) => {
    await fetch(`/api/amis/${id}`, { method: "DELETE" });
    fetchAmis();
  };

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteErr(""); setInviteMsg("");
    const val = search.trim();
    if (!val) return;
    setInviting(true);
    const body = val.includes("@") ? { email: val } : { pseudo: val };
    const res = await fetch("/api/amis", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json() as { error?: string };
    setInviting(false);
    if (!res.ok) { setInviteErr(data.error ?? "Erreur"); return; }
    setInviteMsg(`Demande envoyée !`);
    setSearch("");
    fetchAmis();
  };

  if (!meId) return null;

  const friends   = rows.filter(r => r.statut === "accepte");
  const received  = rows.filter(r => r.statut === "en_attente" && r.ami_id === meId);
  const sent      = rows.filter(r => r.statut === "en_attente" && r.user_id === meId);

  const pseudoOf = (r: AmiRow) => r.user_id === meId
    ? (r.profiles_ami?.pseudo ?? "?")
    : (r.profiles_user?.pseudo ?? "?");

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/profil" className="text-sm text-amber-700 hover:underline">← Mon profil</Link>
        <h1 className="text-2xl font-black text-amber-950">Mes amis</h1>
      </div>

      {/* Invite form */}
      <div className="bg-white rounded-2xl border border-amber-100 p-5 mb-6 shadow-sm">
        <h2 className="text-sm font-bold text-amber-900 mb-3">Inviter un ami</h2>
        <form onSubmit={invite} className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Pseudo ou email…"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400"
          />
          <button
            type="submit"
            disabled={inviting || !search.trim()}
            className="bg-amber-700 hover:bg-amber-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
          >
            {inviting ? "…" : "Inviter"}
          </button>
        </form>
        {inviteMsg && <p className="text-emerald-600 text-xs mt-2">{inviteMsg}</p>}
        {inviteErr && <p className="text-red-600 text-xs mt-2">{inviteErr}</p>}
      </div>

      {loading && <p className="text-gray-400 text-sm">Chargement…</p>}

      {/* Pending received */}
      {received.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-bold text-amber-900 mb-3">Demandes reçues ({received.length})</h2>
          <div className="flex flex-col gap-2">
            {received.map(r => (
              <div key={r.id} className="bg-amber-50 rounded-xl border border-amber-200 px-4 py-3 flex items-center gap-3">
                <span className="w-9 h-9 rounded-full bg-amber-700 text-white font-black flex items-center justify-center shrink-0">
                  {(pseudoOf(r)[0] ?? "?").toUpperCase()}
                </span>
                <span className="flex-1 font-semibold text-sm text-gray-900">{pseudoOf(r)}</span>
                <button onClick={() => respond(r.id, "accepte")} className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg transition-colors">✓ Accepter</button>
                <button onClick={() => respond(r.id, "refuse")}  className="text-xs font-bold text-gray-500 border border-gray-200 hover:border-red-200 hover:text-red-600 px-3 py-1.5 rounded-lg transition-colors">✕</button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Friends */}
      <section className="mb-6">
        <h2 className="text-sm font-bold text-amber-900 mb-3">Amis ({friends.length})</h2>
        {friends.length === 0 ? (
          <p className="text-gray-400 text-sm">Aucun ami pour l&apos;instant.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {friends.map(r => {
              const pseudo = pseudoOf(r);
              return (
                <div key={r.id} className="bg-white rounded-xl border border-amber-100 px-4 py-3 flex items-center gap-3 hover:border-amber-300 transition-colors">
                  <span className="w-9 h-9 rounded-full bg-amber-700 text-white font-black flex items-center justify-center shrink-0">
                    {(pseudo[0] ?? "?").toUpperCase()}
                  </span>
                  <Link href={`/profil/${pseudo}`} className="flex-1 font-semibold text-sm text-gray-900 hover:text-amber-800">
                    {pseudo}
                  </Link>
                  <Link href={`/profil/${pseudo}#commun`} className="text-xs text-amber-700 font-semibold hover:underline">Jeux en commun</Link>
                  <button onClick={() => remove(r.id)} className="text-xs text-gray-400 hover:text-red-500 transition-colors ml-1">✕</button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Sent pending */}
      {sent.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-gray-400 mb-3">Demandes envoyées ({sent.length})</h2>
          <div className="flex flex-col gap-2">
            {sent.map(r => (
              <div key={r.id} className="bg-gray-50 rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-3">
                <span className="flex-1 text-sm text-gray-600">{pseudoOf(r)}</span>
                <span className="text-xs text-orange-500 font-medium">En attente</span>
                <button onClick={() => remove(r.id)} className="text-xs text-gray-400 hover:text-red-500">Annuler</button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
