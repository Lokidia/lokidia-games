"use client";

import { useRef, useState } from "react";
import JeuForm, { type AdminCategorie, type AdminJeuFull } from "../../jeux/_components/JeuForm";

interface AdminJeuEnrich {
  id: string;
  slug: string;
  nom: string;
  description: string | null;
  image_url: string | null;
  regles: string[] | null;
  mecaniques: string[] | null;
  annee: number;
  joueurs_min: number;
  joueurs_max: number;
  duree_min: number;
  duree_max: number;
  age_min: number;
  complexite: string;
  note: number;
  updated_at: string;
  jeux_prix: { marchand: string; prix: string; url: string }[];
  jeux_categories: { categorie_id: string; categories: { id: string; nom: string } | null }[];
}

interface Props {
  initialJeux: AdminJeuEnrich[];
}

function score(jeu: AdminJeuEnrich): number {
  let s = 0;
  if (jeu.image_url) s++;
  if (jeu.description && jeu.description.length > 50) s++;
  if ((jeu.regles?.length ?? 0) > 0) s++;
  const hasPrix = jeu.jeux_prix?.some((p) => p.url && p.prix);
  if (hasPrix) s++;
  if ((jeu.jeux_categories?.length ?? 0) > 0) s++;
  return s; // max 5
}

function canEnrich(jeu: AdminJeuEnrich): boolean {
  return !jeu.description || jeu.description.length < 50 || (jeu.regles?.length ?? 0) === 0;
}

function Check({ ok }: { ok: boolean }) {
  return (
    <span className={`text-base ${ok ? "text-emerald-500" : "text-red-400"}`}>
      {ok ? "✅" : "❌"}
    </span>
  );
}

function PctBadge({ pct }: { pct: number }) {
  const color =
    pct === 100 ? "bg-emerald-100 text-emerald-700"
    : pct >= 60  ? "bg-amber-100 text-amber-700"
    : "bg-red-100 text-red-600";
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>
      {pct} %
    </span>
  );
}

export default function EnrichissementManager({ initialJeux }: Props) {
  const [jeux, setJeux]               = useState<AdminJeuEnrich[]>(initialJeux);
  const [filter, setFilter]           = useState<"all" | "incomplete">("all");
  const [search, setSearch]           = useState("");
  const [editingJeu, setEditingJeu]   = useState<AdminJeuFull | null>(null);
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);
  const [enrichingSlug, setEnrichingSlug] = useState<string | null>(null);
  const [toast, setToast]             = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Bulk AI enrichment state
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0, current: "" });
  const abortBulkRef = useRef(false);

  // Bulk EAN state
  const [eanRunning, setEanRunning] = useState(false);
  const [eanProgress, setEanProgress] = useState({ done: 0, total: 0, current: "" });
  const abortEanRef = useRef(false);

  // Bulk YouTube state
  const [ytRunning, setYtRunning] = useState(false);
  const [ytProgress, setYtProgress] = useState({ done: 0, total: 0, current: "" });
  const abortYtRef = useRef(false);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  // Patch a single jeu in local state with API result
  function patchJeu(slug: string, updates: Partial<AdminJeuEnrich>) {
    setJeux(prev => prev.map(j => j.slug === slug ? { ...j, ...updates } : j));
  }

  async function enrichSingle(slug: string, silent = false): Promise<boolean> {
    setEnrichingSlug(slug);
    try {
      const res = await fetch("/api/admin/enrichissement/auto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const data = await res.json() as {
        ok?: boolean;
        unchanged?: boolean;
        description?: string;
        regles?: string[];
        mecaniques?: string[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      if (data.unchanged) {
        if (!silent) showToast("success", `"${slug}" déjà enrichi`);
        return false;
      }
      patchJeu(slug, {
        description: data.description,
        regles:      data.regles,
        mecaniques:  data.mecaniques,
      });
      if (!silent) showToast("success", `"${slug}" enrichi avec succès`);
      return true;
    } catch (e) {
      if (!silent) showToast("error", `Erreur : ${e instanceof Error ? e.message : String(e)}`);
      return false;
    } finally {
      setEnrichingSlug(null);
    }
  }

  async function enrichAll() {
    const targets = jeux.filter(canEnrich);
    if (targets.length === 0) { showToast("success", "Tous les jeux sont déjà enrichis !"); return; }

    abortBulkRef.current = false;
    setBulkRunning(true);
    setBulkProgress({ done: 0, total: targets.length, current: "" });

    let enriched = 0;
    for (let i = 0; i < targets.length; i++) {
      if (abortBulkRef.current) break;
      const jeu = targets[i];
      setBulkProgress({ done: i, total: targets.length, current: jeu.nom });
      const ok = await enrichSingle(jeu.slug, true);
      if (ok) enriched++;
      setBulkProgress({ done: i + 1, total: targets.length, current: jeu.nom });
    }

    setBulkRunning(false);
    showToast("success", `Enrichissement terminé : ${enriched} jeu${enriched > 1 ? "x" : ""} mis à jour`);
  }

  async function enrichAllEan() {
    abortEanRef.current = false;
    setEanRunning(true);
    setEanProgress({ done: 0, total: jeux.length, current: "" });
    let found = 0;
    for (let i = 0; i < jeux.length; i++) {
      if (abortEanRef.current) break;
      const jeu = jeux[i];
      setEanProgress({ done: i, total: jeux.length, current: jeu.nom });
      try {
        const res = await fetch(`/api/admin/jeux/${jeu.slug}/fetch-ean`, { method: "POST" });
        const data = await res.json() as { found?: boolean };
        if (data.found) found++;
      } catch { /* continue */ }
      setEanProgress({ done: i + 1, total: jeux.length, current: jeu.nom });
    }
    setEanRunning(false);
    showToast("success", `EAN : ${found} code${found > 1 ? "s" : ""} trouvé${found > 1 ? "s" : ""}`);
  }

  async function enrichAllYoutube() {
    abortYtRef.current = false;
    setYtRunning(true);
    setYtProgress({ done: 0, total: jeux.length, current: "" });
    let found = 0;
    for (let i = 0; i < jeux.length; i++) {
      if (abortYtRef.current) break;
      const jeu = jeux[i];
      setYtProgress({ done: i, total: jeux.length, current: jeu.nom });
      try {
        const res = await fetch(`/api/admin/jeux/${jeu.slug}/fetch-youtube`, { method: "POST" });
        const data = await res.json() as { found?: boolean };
        if (data.found) found++;
      } catch { /* continue */ }
      setYtProgress({ done: i + 1, total: jeux.length, current: jeu.nom });
    }
    setYtRunning(false);
    showToast("success", `YouTube : ${found} vidéo${found > 1 ? "s" : ""} trouvée${found > 1 ? "s" : ""}`);
  }

  const sorted = jeux
    .filter((j) => {
      const matchSearch = j.nom.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === "all" || score(j) < 5;
      return matchSearch && matchFilter;
    })
    .sort((a, b) => score(a) - score(b));

  const nbComplete    = jeux.filter((j) => score(j) === 5).length;
  const nbEnrichable  = jeux.filter(canEnrich).length;

  async function openEdit(jeu: AdminJeuEnrich) {
    setLoadingSlug(jeu.slug);
    try {
      const res = await fetch(`/api/admin/jeux/${jeu.slug}`);
      if (!res.ok) throw new Error("Erreur de chargement");
      const data = await res.json() as AdminJeuFull;
      setEditingJeu(data);
    } catch {
      showToast("error", "Impossible de charger le jeu");
    } finally {
      setLoadingSlug(null);
    }
  }

  function handleSaved(slug: string) {
    setEditingJeu(null);
    showToast("success", `Jeu "${slug}" mis à jour`);
    fetch("/api/admin/jeux")
      .then((r) => r.json())
      .then((data) => setJeux(data as AdminJeuEnrich[]))
      .catch(() => null);
  }

  const categories: AdminCategorie[] = (jeux
    .flatMap((j) =>
      (j.jeux_categories ?? []).map((jc) =>
        jc.categories ? { id: jc.categories.id, slug: "", nom: jc.categories.nom, type: "category" as const, parent_id: null } : null,
      ),
    )
    .filter((x) => x !== null) as AdminCategorie[])
    .filter((c, i, arr) => arr.findIndex((x) => x.id === c.id) === i);

  const bulkPct = bulkProgress.total > 0
    ? Math.round((bulkProgress.done / bulkProgress.total) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">Admin</p>
          <h1 className="text-3xl font-black text-amber-950">Enrichissement des données</h1>
          <p className="text-gray-500 text-sm mt-1">
            {nbComplete} / {jeux.length} jeux complets (100 %) · {nbEnrichable} enrichissables automatiquement
          </p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          {/* AI bulk */}
          {bulkRunning ? (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
              <div className="text-sm text-blue-700 min-w-[140px]">
                <p className="font-semibold">🤖 {bulkProgress.done}/{bulkProgress.total}…</p>
                {bulkProgress.current && <p className="text-xs truncate max-w-[160px] text-blue-500">{bulkProgress.current}</p>}
              </div>
              <button onClick={() => { abortBulkRef.current = true; setBulkRunning(false); }} className="text-xs font-bold text-red-600 hover:text-red-800">✕</button>
            </div>
          ) : (
            <button onClick={enrichAll} disabled={nbEnrichable === 0 || eanRunning || ytRunning}
              className="inline-flex items-center gap-1.5 bg-amber-700 hover:bg-amber-800 disabled:opacity-40 text-white font-bold px-3 py-2 rounded-xl text-sm transition-colors shadow-sm"
            >🤖 IA ({nbEnrichable})</button>
          )}

          {/* EAN bulk */}
          {eanRunning ? (
            <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-xl px-3 py-2">
              <div className="text-sm text-teal-700 min-w-[140px]">
                <p className="font-semibold">🔍 EAN {eanProgress.done}/{eanProgress.total}…</p>
                {eanProgress.current && <p className="text-xs truncate max-w-[160px] text-teal-500">{eanProgress.current}</p>}
              </div>
              <button onClick={() => { abortEanRef.current = true; setEanRunning(false); }} className="text-xs font-bold text-red-600 hover:text-red-800">✕</button>
            </div>
          ) : (
            <button onClick={enrichAllEan} disabled={bulkRunning || ytRunning}
              className="inline-flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 disabled:opacity-40 text-white font-bold px-3 py-2 rounded-xl text-sm transition-colors shadow-sm"
            >🔍 Tout enrichir EAN</button>
          )}

          {/* YouTube bulk */}
          {ytRunning ? (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              <div className="text-sm text-red-700 min-w-[140px]">
                <p className="font-semibold">▶️ YT {ytProgress.done}/{ytProgress.total}…</p>
                {ytProgress.current && <p className="text-xs truncate max-w-[160px] text-red-400">{ytProgress.current}</p>}
              </div>
              <button onClick={() => { abortYtRef.current = true; setYtRunning(false); }} className="text-xs font-bold text-red-600 hover:text-red-800">✕</button>
            </div>
          ) : (
            <button onClick={enrichAllYoutube} disabled={bulkRunning || eanRunning}
              className="inline-flex items-center gap-1.5 bg-red-700 hover:bg-red-800 disabled:opacity-40 text-white font-bold px-3 py-2 rounded-xl text-sm transition-colors shadow-sm"
            >▶️ Tout enrichir YouTube</button>
          )}
        </div>
      </div>

      {toast && (
        <div className={`rounded-xl px-4 py-3 text-sm font-medium ${toast.type === "success" ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
          {toast.type === "success" ? "✅" : "⚠"} {toast.msg}
        </div>
      )}

      {/* Progress bar global */}
      <div className="bg-white rounded-2xl border border-amber-100 p-5 shadow-sm space-y-3">
        <div className="flex justify-between text-sm font-semibold text-amber-900 mb-2">
          <span>Complétude globale</span>
          <span>{nbComplete} / {jeux.length} jeux</span>
        </div>
        <div className="w-full bg-amber-100 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.round((nbComplete / Math.max(jeux.length, 1)) * 100)}%` }}
          />
        </div>

        {/* AI progress bar */}
        {(bulkRunning || bulkProgress.done > 0) && bulkProgress.total > 0 && (
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>🤖 Enrichissement IA</span>
              <span>{bulkPct}%</span>
            </div>
            <div className="w-full bg-blue-100 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${bulkPct}%` }} />
            </div>
          </div>
        )}

        {/* EAN progress bar */}
        {(eanRunning || eanProgress.done > 0) && eanProgress.total > 0 && (() => {
          const pct = Math.round((eanProgress.done / eanProgress.total) * 100);
          return (
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>🔍 Enrichissement EAN</span>
                <span>{pct}%</span>
              </div>
              <div className="w-full bg-teal-100 rounded-full h-2 overflow-hidden">
                <div className="h-full bg-teal-500 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })()}

        {/* YouTube progress bar */}
        {(ytRunning || ytProgress.done > 0) && ytProgress.total > 0 && (() => {
          const pct = Math.round((ytProgress.done / ytProgress.total) * 100);
          return (
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>▶️ Enrichissement YouTube</span>
                <span>{pct}%</span>
              </div>
              <div className="w-full bg-red-100 rounded-full h-2 overflow-hidden">
                <div className="h-full bg-red-500 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })()}

        <div className="text-xs text-gray-500">
          ✅ Image &nbsp;·&nbsp; ✅ Description &nbsp;·&nbsp; ✅ Règles &nbsp;·&nbsp; ✅ Prix &nbsp;·&nbsp; ✅ Catégories
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input max-w-xs"
          placeholder="🔍 Rechercher…"
        />
        <div className="flex gap-2">
          {(["all", "incomplete"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-sm font-medium px-3 py-1.5 rounded-xl transition-colors ${filter === f ? "bg-amber-700 text-white" : "bg-white border border-amber-200 text-amber-800 hover:bg-amber-50"}`}
            >
              {f === "all" ? "Tous" : "Incomplets seulement"}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-400">{sorted.length} résultat{sorted.length > 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-amber-100 bg-amber-50/60">
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Jeu</th>
                <th className="text-center px-3 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">🖼️</th>
                <th className="text-center px-3 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">📝</th>
                <th className="text-center px-3 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">📋</th>
                <th className="text-center px-3 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">💰</th>
                <th className="text-center px-3 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">🗂️</th>
                <th className="text-center px-3 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Score</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-50">
              {sorted.map((jeu) => {
                const s        = score(jeu);
                const pct      = Math.round((s / 5) * 100);
                const hasImage = !!jeu.image_url;
                const hasDesc  = !!(jeu.description && jeu.description.length > 50);
                const hasRegles = (jeu.regles?.length ?? 0) > 0;
                const hasPrix  = jeu.jeux_prix?.some((p) => p.url && p.prix) ?? false;
                const hasCats  = (jeu.jeux_categories?.length ?? 0) > 0;
                const isEditing   = loadingSlug === jeu.slug;
                const isEnriching = enrichingSlug === jeu.slug;
                const enrichable  = canEnrich(jeu);

                return (
                  <tr key={jeu.slug} className="hover:bg-amber-50/40 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-amber-900">{jeu.nom}</p>
                      <p className="text-xs text-gray-400 font-mono">{jeu.slug}</p>
                    </td>
                    <td className="px-3 py-3 text-center"><Check ok={hasImage} /></td>
                    <td className="px-3 py-3 text-center"><Check ok={hasDesc} /></td>
                    <td className="px-3 py-3 text-center"><Check ok={hasRegles} /></td>
                    <td className="px-3 py-3 text-center"><Check ok={hasPrix} /></td>
                    <td className="px-3 py-3 text-center"><Check ok={hasCats} /></td>
                    <td className="px-3 py-3 text-center"><PctBadge pct={pct} /></td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => enrichSingle(jeu.slug)}
                          disabled={isEnriching || bulkRunning || !enrichable}
                          title={enrichable ? "Générer description/règles avec Claude Haiku" : "Déjà enrichi"}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 ${
                            enrichable
                              ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                              : "bg-gray-100 text-gray-400 cursor-default"
                          }`}
                        >
                          {isEnriching ? "…" : "🤖 Enrichir"}
                        </button>
                        <button
                          onClick={() => openEdit(jeu)}
                          disabled={isEditing}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-200 disabled:opacity-50 transition-colors"
                        >
                          {isEditing ? "…" : "✏️ Éditer"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-gray-400 text-sm">
                    {filter === "incomplete" ? "🎉 Tous les jeux sont complets !" : "Aucun jeu trouvé"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal édition */}
      {editingJeu && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-amber-100">
              <h2 className="text-xl font-black text-amber-950">Enrichir : {editingJeu.nom}</h2>
              <button onClick={() => setEditingJeu(null)} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
            </div>
            <div className="px-6 py-6 overflow-y-auto max-h-[calc(100vh-12rem)]">
              <JeuForm
                initialData={editingJeu}
                categories={categories}
                onSaved={handleSaved}
                onCancel={() => setEditingJeu(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
