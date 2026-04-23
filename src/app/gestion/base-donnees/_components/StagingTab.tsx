"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

interface StagingItem {
  id: string;
  nom: string;
  asin: string | null;
  prix: string | null;
  image_url: string | null;
  url_amazon: string | null;
  source: string;
  statut: "en_attente" | "approuve" | "rejete";
  date_scraping: string;
  doublon_detecte: boolean;
  doublon_ref: string | null;
  jeu_id: string | null;
}

type ItemAction = "idle" | "publishing" | "rejecting";

const STATUT_CONFIG = {
  en_attente: { label: "En attente",  color: "bg-blue-100 text-blue-700" },
  approuve:   { label: "Approuvé ✅", color: "bg-green-100 text-green-700" },
  rejete:     { label: "Rejeté ❌",   color: "bg-gray-100 text-gray-500" },
};

function PreviewModal({ id, onClose }: { id: string; onClose: () => void }) {
  const [raw, setRaw] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetch(`/api/admin/staging/${id}`)
      .then((r) => r.json())
      .then((d) => setRaw(d.item));
  }, [id]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-auto p-6"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-amber-900">Données brutes</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>
        </div>
        {raw ? (
          <pre className="text-xs bg-gray-50 rounded-lg p-4 overflow-auto whitespace-pre-wrap break-all">
            {JSON.stringify(raw, null, 2)}
          </pre>
        ) : (
          <p className="text-gray-400 text-sm">Chargement…</p>
        )}
      </div>
    </div>
  );
}

export default function StagingTab() {
  const [items, setItems] = useState<StagingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatut, setFilterStatut] = useState<string>("en_attente");
  const [filterSource, setFilterSource] = useState<string>("");
  const [actions, setActions] = useState<Record<string, ItemAction>>({});
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [publishMsg, setPublishMsg] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatut) params.set("statut", filterStatut);
    if (filterSource) params.set("source", filterSource);
    const res = await fetch(`/api/admin/staging?${params}`);
    const data = await res.json();
    setItems(data.items ?? []);
    setLoading(false);
  }, [filterStatut, filterSource]);

  useEffect(() => { load(); }, [load]);

  const setAction = (id: string, action: ItemAction) =>
    setActions((prev) => ({ ...prev, [id]: action }));

  const handlePublish = useCallback(async (item: StagingItem) => {
    setAction(item.id, "publishing");
    setPublishMsg((prev) => ({ ...prev, [item.id]: "" }));
    try {
      const res = await fetch(`/api/admin/staging/${item.id}/publish`, { method: "POST" });
      const data = await res.json();
      if (res.status === 409 && data.duplicate) {
        setPublishMsg((prev) => ({ ...prev, [item.id]: `Doublon : déjà dans jeux` }));
        setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, statut: "approuve" } : i));
      } else if (!res.ok) {
        throw new Error(data.error);
      } else {
        setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, statut: "approuve", jeu_id: data.jeu?.id } : i));
        setPublishMsg((prev) => ({ ...prev, [item.id]: `Publié → /jeu/${data.jeu?.slug}` }));
      }
    } catch (err) {
      setPublishMsg((prev) => ({ ...prev, [item.id]: `Erreur : ${(err as Error).message}` }));
    } finally {
      setAction(item.id, "idle");
    }
  }, []);

  const handleReject = useCallback(async (item: StagingItem) => {
    setAction(item.id, "rejecting");
    await fetch(`/api/admin/staging/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut: "rejete" }),
    });
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, statut: "rejete" } : i));
    setAction(item.id, "idle");
  }, []);

  const handleRestore = useCallback(async (item: StagingItem) => {
    await fetch(`/api/admin/staging/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut: "en_attente" }),
    });
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, statut: "en_attente" } : i));
  }, []);

  const counts = {
    en_attente: items.filter((i) => i.statut === "en_attente").length,
    approuve:   items.filter((i) => i.statut === "approuve").length,
    rejete:     items.filter((i) => i.statut === "rejete").length,
  };

  return (
    <div className="flex flex-col gap-4">
      {previewId && <PreviewModal id={previewId} onClose={() => setPreviewId(null)} />}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-amber-100 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <div className="flex gap-1">
          {(["", "en_attente", "approuve", "rejete"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatut(s)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                filterStatut === s ? "bg-amber-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-amber-50"
              }`}
            >
              {s === "" ? `Tous (${items.length})` : `${STATUT_CONFIG[s as keyof typeof STATUT_CONFIG].label} (${counts[s as keyof typeof counts]})`}
            </button>
          ))}
        </div>
        <select
          value={filterSource}
          onChange={(e) => setFilterSource(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400"
        >
          <option value="">Toutes sources</option>
          <option value="amazon">Amazon</option>
          <option value="asmodee">Asmodée</option>
          <option value="manuel">Manuel</option>
        </select>
        <button onClick={load} className="ml-auto text-xs text-amber-700 hover:text-amber-900 font-semibold transition-colors">
          ↻ Actualiser
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Chargement…
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="bg-white rounded-xl border border-dashed border-amber-200 p-12 text-center">
          <span className="text-4xl block mb-3">📋</span>
          <p className="text-gray-500 text-sm">Aucun produit en staging pour ces filtres.</p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="flex flex-col gap-2">
          {items.map((item) => {
            const action = actions[item.id] ?? "idle";
            const msg = publishMsg[item.id];
            const { label: statutLabel, color: statutColor } = STATUT_CONFIG[item.statut];

            return (
              <div
                key={item.id}
                className={`bg-white rounded-xl border shadow-sm overflow-hidden flex gap-0 ${
                  item.statut === "rejete" ? "opacity-60 border-gray-100" : "border-amber-100"
                }`}
              >
                {/* Thumbnail */}
                <div className="relative w-20 shrink-0 bg-gray-50 flex items-center justify-center">
                  {item.image_url ? (
                    <Image src={item.image_url} alt={item.nom} fill className="object-contain p-2" unoptimized />
                  ) : (
                    <span className="text-2xl opacity-20">🎲</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 p-3 flex flex-col gap-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-sm text-gray-900 line-clamp-1">{item.nom}</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${statutColor}`}>
                      {statutLabel}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                    {item.prix && <span className="font-bold text-amber-700">{item.prix}</span>}
                    {item.asin && <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">{item.asin}</span>}
                    <span className="capitalize">{item.source}</span>
                    <span>{new Date(item.date_scraping).toLocaleDateString("fr-FR")}</span>
                  </div>
                  {item.doublon_detecte && (
                    <p className="text-xs text-amber-600">⚠️ Doublon : {item.doublon_ref}</p>
                  )}
                  {msg && (
                    <p className={`text-xs font-medium ${msg.startsWith("Erreur") ? "text-red-600" : "text-green-700"}`}>
                      {msg}
                    </p>
                  )}
                  {item.jeu_id && !msg && (
                    <a href={`/gestion/jeux`} className="text-xs text-green-700 hover:underline">Voir dans Jeux →</a>
                  )}
                </div>

                {/* Actions */}
                <div className="shrink-0 flex flex-col gap-1.5 p-3 justify-center">
                  <button
                    onClick={() => setPreviewId(item.id)}
                    className="px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
                  >
                    👁️ Aperçu
                  </button>
                  {item.statut === "en_attente" && (
                    <>
                      <button
                        onClick={() => handlePublish(item)}
                        disabled={action !== "idle"}
                        className="px-3 py-1.5 text-xs font-semibold bg-amber-700 hover:bg-amber-800 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1 justify-center"
                      >
                        {action === "publishing" ? (
                          <><svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>Enrichissement…</>
                        ) : "✅ Publier"}
                      </button>
                      <button
                        onClick={() => handleReject(item)}
                        disabled={action !== "idle"}
                        className="px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-700 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {action === "rejecting" ? "…" : "❌ Rejeter"}
                      </button>
                    </>
                  )}
                  {item.statut === "rejete" && (
                    <button
                      onClick={() => handleRestore(item)}
                      className="px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-amber-50 text-gray-600 rounded-lg transition-colors"
                    >
                      ↩️ Restaurer
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
