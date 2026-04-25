"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

interface Jeu { id: string; nom: string; slug: string }
interface Ami { id: string; pseudo: string }

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export default function NouvellePartieForm({ onClose, onCreated }: Props) {
  const [jeux, setJeux]         = useState<Jeu[]>([]);
  const [amis, setAmis]         = useState<Ami[]>([]);
  const [meId, setMeId]         = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const [err, setErr]           = useState("");

  const [jeuId, setJeuId]           = useState("");
  const [jeuSearch, setJeuSearch]   = useState("");
  const [date, setDate]             = useState(new Date().toISOString().slice(0, 10));
  const [duree, setDuree]           = useState("");
  const [selectedAmis, setSelectedAmis] = useState<string[]>([]);
  const [gagnantId, setGagnantId]   = useState("");
  const [notes, setNotes]           = useState("");

  useEffect(() => {
    const sb = createClient();
    sb.auth.getUser().then(({ data: { user } }) => setMeId(user?.id ?? null));

    // Pre-load first 30 games for autocomplete
    fetch("/api/parties/jeux-search?q=").then(r => r.ok ? r.json() : { jeux: [] }).then(d => setJeux(d.jeux ?? []));

    // Fetch accepted friends
    fetch("/api/amis").then(r => r.ok ? r.json() : { amis: [] }).then(async (d) => {
      const sb2 = createClient();
      const { data: { user } } = await sb2.auth.getUser();
      if (!user) return;
      type AmiRow = { id: string; statut: string; user_id: string; ami_id: string; profiles_user: { pseudo: string } | null; profiles_ami: { pseudo: string } | null };
      const rows: AmiRow[] = (d.amis ?? []).filter((r: AmiRow) => r.statut === "accepte");
      setAmis(rows.map((r) => ({
        id: r.user_id === user.id ? r.ami_id : r.user_id,
        pseudo: r.user_id === user.id
          ? (r.profiles_ami?.pseudo ?? "?")
          : (r.profiles_user?.pseudo ?? "?"),
      })));
    });
  }, []);

  useEffect(() => {
    if (jeuSearch.length < 2 || jeuId) return;
    const t = setTimeout(() => {
      fetch(`/api/parties/jeux-search?q=${encodeURIComponent(jeuSearch)}`)
        .then(r => r.ok ? r.json() : { jeux: [] })
        .then(d => setJeux(d.jeux ?? []));
    }, 200);
    return () => clearTimeout(t);
  }, [jeuSearch, jeuId]);

  const filteredJeux = jeux.filter(j => j.nom.toLowerCase().includes(jeuSearch.toLowerCase()));

  const allPlayers = [
    ...(meId ? [{ id: meId, pseudo: "Moi" }] : []),
    ...amis.filter(a => selectedAmis.includes(a.id)),
  ];

  const toggleAmi = (id: string) => {
    setSelectedAmis(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    const res = await fetch("/api/parties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jeu_id: jeuId || undefined,
        date_partie: date,
        duree_minutes: duree ? parseInt(duree) : undefined,
        gagnant_id: gagnantId || undefined,
        joueurs: selectedAmis,
        notes: notes || undefined,
      }),
    });
    const data = await res.json() as { error?: string };
    if (!res.ok) { setErr(data.error ?? "Erreur"); setLoading(false); return; }
    onCreated();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-black text-amber-950">Nouvelle partie</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {/* Game search */}
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Jeu joué</label>
            <input
              type="text"
              placeholder="Rechercher un jeu…"
              value={jeuSearch}
              onChange={e => { setJeuSearch(e.target.value); setJeuId(""); }}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
            />
            {jeuSearch && !jeuId && filteredJeux.length > 0 && (
              <div className="border border-gray-100 rounded-xl mt-1 max-h-36 overflow-y-auto shadow-md bg-white">
                {filteredJeux.slice(0, 8).map(j => (
                  <button
                    key={j.id}
                    type="button"
                    onClick={() => { setJeuId(j.id); setJeuSearch(j.nom); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-amber-50 transition-colors"
                  >
                    {j.nom}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Date de la partie</label>
            <input
              type="date"
              required
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Durée (minutes)</label>
            <input
              type="number"
              placeholder="ex. 90"
              value={duree}
              onChange={e => setDuree(e.target.value)}
              min="1"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Players */}
          {amis.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Joueurs (amis)</label>
              <div className="flex flex-wrap gap-2">
                {amis.map(a => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => toggleAmi(a.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                      selectedAmis.includes(a.id)
                        ? "bg-amber-700 text-white border-amber-700"
                        : "border-gray-200 text-gray-600 hover:border-amber-300"
                    }`}
                  >
                    {a.pseudo}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Winner */}
          {allPlayers.length > 1 && (
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Gagnant</label>
              <select
                value={gagnantId}
                onChange={e => setGagnantId(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
              >
                <option value="">Pas de gagnant / Pas encore joué</option>
                {allPlayers.map(p => (
                  <option key={p.id} value={p.id}>{p.pseudo}</option>
                ))}
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Notes</label>
            <textarea
              placeholder="Impressions, anecdotes…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-400 resize-none"
            />
          </div>

          {err && <p className="text-red-600 text-sm text-center">{err}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl text-sm hover:border-amber-300 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-amber-700 hover:bg-amber-800 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
            >
              {loading ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
