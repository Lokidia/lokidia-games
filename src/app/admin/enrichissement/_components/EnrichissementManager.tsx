"use client";

import { useState } from "react";
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
  const [jeux, setJeux] = useState<AdminJeuEnrich[]>(initialJeux);
  const [filter, setFilter] = useState<"all" | "incomplete">("all");
  const [search, setSearch] = useState("");
  const [editingJeu, setEditingJeu] = useState<AdminJeuFull | null>(null);
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  const sorted = jeux
    .filter((j) => {
      const matchSearch = j.nom.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === "all" || score(j) < 5;
      return matchSearch && matchFilter;
    })
    .sort((a, b) => score(a) - score(b));

  const nbComplete = jeux.filter((j) => score(j) === 5).length;

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

  // Dummy categories for the form (will be fetched via the page but we need to pass something)
  const categories: AdminCategorie[] = jeux
    .flatMap((j) =>
      (j.jeux_categories ?? []).map((jc) =>
        jc.categories ? { id: jc.categories.id, slug: "", nom: jc.categories.nom, type: "category", parent_id: null } : null,
      ),
    )
    .filter((c): c is AdminCategorie => c !== null)
    .filter((c, i, arr) => arr.findIndex((x) => x.id === c.id) === i);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">Admin</p>
        <h1 className="text-3xl font-black text-amber-950">Enrichissement des données</h1>
        <p className="text-gray-500 text-sm mt-1">
          {nbComplete} / {jeux.length} jeux complets (100 %)
        </p>
      </div>

      {toast && (
        <div className={`rounded-xl px-4 py-3 text-sm font-medium ${toast.type === "success" ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
          {toast.type === "success" ? "✅" : "⚠"} {toast.msg}
        </div>
      )}

      {/* Progress bar global */}
      <div className="bg-white rounded-2xl border border-amber-100 p-5 shadow-sm">
        <div className="flex justify-between text-sm font-semibold text-amber-900 mb-2">
          <span>Complétude globale</span>
          <span>{nbComplete} / {jeux.length} jeux</span>
        </div>
        <div className="w-full bg-amber-100 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.round((nbComplete / jeux.length) * 100)}%` }}
          />
        </div>
        <div className="flex gap-4 mt-3 text-xs text-gray-500">
          <span>✅ Image &nbsp;·&nbsp; ✅ Description &nbsp;·&nbsp; ✅ Règles &nbsp;·&nbsp; ✅ Prix &nbsp;·&nbsp; ✅ Catégories</span>
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
                <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-50">
              {sorted.map((jeu) => {
                const s = score(jeu);
                const pct = Math.round((s / 5) * 100);
                const hasImage = !!jeu.image_url;
                const hasDesc = !!(jeu.description && jeu.description.length > 50);
                const hasRegles = (jeu.regles?.length ?? 0) > 0;
                const hasPrix = jeu.jeux_prix?.some((p) => p.url && p.prix) ?? false;
                const hasCats = (jeu.jeux_categories?.length ?? 0) > 0;
                const isLoading = loadingSlug === jeu.slug;

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
                      <button
                        onClick={() => openEdit(jeu)}
                        disabled={isLoading}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-200 disabled:opacity-50 transition-colors"
                      >
                        {isLoading ? "…" : "✏️ Éditer"}
                      </button>
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
