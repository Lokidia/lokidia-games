"use client";

import { useState, useCallback } from "react";

interface JeuRow {
  id: string;
  slug: string;
  nom: string;
  jeux_categories: { categorie_id: string }[];
}

interface CatRow {
  id: string;
  slug: string;
  nom: string;
  type: string;
  parent_id: string | null;
}

interface Props {
  jeux: JeuRow[];
  categories: CatRow[];
}

export default function AssociationsEditor({ jeux, categories }: Props) {
  const [search, setSearch] = useState("");
  const [selectedJeu, setSelectedJeu] = useState<JeuRow | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const roots = categories.filter((c) => !c.parent_id);
  const children = (pid: string) => categories.filter((c) => c.parent_id === pid);

  const filteredJeux = jeux.filter((j) =>
    j.nom.toLowerCase().includes(search.toLowerCase()),
  );

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }

  function selectJeu(jeu: JeuRow) {
    setSelectedJeu(jeu);
    setSaved(false);
    setCheckedIds(new Set(jeu.jeux_categories.map((jc) => jc.categorie_id)));
  }

  function toggle(id: string) {
    setSaved(false);
    setCheckedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const save = useCallback(async () => {
    if (!selectedJeu) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/associations/${selectedJeu.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryIds: Array.from(checkedIds) }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setSaved(true);
      showToast("success", `Associations de "${selectedJeu.nom}" enregistrées`);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }, [selectedJeu, checkedIds]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">Admin</p>
        <h1 className="text-3xl font-black text-amber-950">Associations jeux ↔ catégories</h1>
        <p className="text-gray-500 text-sm mt-1">
          Sélectionnez un jeu à gauche, cochez ses catégories à droite.
        </p>
      </div>

      {toast && (
        <div className={`rounded-xl px-4 py-3 text-sm font-medium ${toast.type === "success" ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
          {toast.type === "success" ? "✅" : "⚠"} {toast.msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ── Colonne gauche : jeux ── */}
        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-amber-100 bg-amber-50/50">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Jeux ({jeux.length})</p>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input text-sm"
              placeholder="🔍 Filtrer…"
            />
          </div>
          <ul className="overflow-y-auto flex-1" style={{ maxHeight: "60vh" }}>
            {filteredJeux.map((jeu) => {
              const nbCats = jeu.jeux_categories.length;
              const isActive = selectedJeu?.id === jeu.id;
              return (
                <li key={jeu.id}>
                  <button
                    onClick={() => selectJeu(jeu)}
                    className={`w-full text-left px-4 py-3 flex items-center justify-between gap-3 border-b border-amber-50 transition-colors ${isActive ? "bg-amber-700 text-white" : "hover:bg-amber-50/60"}`}
                  >
                    <div>
                      <p className={`font-semibold text-sm ${isActive ? "text-white" : "text-amber-900"}`}>{jeu.nom}</p>
                      <p className={`text-xs font-mono ${isActive ? "text-amber-200" : "text-gray-400"}`}>{jeu.slug}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${isActive ? "bg-amber-600 text-amber-100" : "bg-amber-100 text-amber-700"}`}>
                      {nbCats} cat.
                    </span>
                  </button>
                </li>
              );
            })}
            {filteredJeux.length === 0 && (
              <li className="px-4 py-10 text-center text-gray-400 text-sm">Aucun jeu</li>
            )}
          </ul>
        </div>

        {/* ── Colonne droite : catégories ── */}
        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-amber-100 bg-amber-50/50 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Catégories</p>
              {selectedJeu && (
                <p className="text-sm font-semibold text-amber-900 mt-0.5">{selectedJeu.nom}</p>
              )}
            </div>
            {selectedJeu && (
              <button
                onClick={save}
                disabled={saving || saved}
                className={`shrink-0 text-sm font-semibold px-4 py-1.5 rounded-xl transition-colors ${saved ? "bg-emerald-100 text-emerald-700" : "bg-amber-700 text-white hover:bg-amber-800 disabled:opacity-50"}`}
              >
                {saving ? "Sauvegarde…" : saved ? "✓ Enregistré" : `Enregistrer (${checkedIds.size})`}
              </button>
            )}
          </div>

          {!selectedJeu ? (
            <div className="flex-1 flex items-center justify-center p-10">
              <p className="text-gray-400 text-sm text-center">
                ← Sélectionnez un jeu pour gérer ses catégories
              </p>
            </div>
          ) : (
            <ul className="overflow-y-auto flex-1 py-2 px-2" style={{ maxHeight: "60vh" }}>
              {roots.map((root) => (
                <li key={root.id} className="mb-1">
                  {/* Root category */}
                  <label className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-amber-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checkedIds.has(root.id)}
                      onChange={() => toggle(root.id)}
                      className="accent-amber-600 w-4 h-4 shrink-0"
                    />
                    <span className="text-sm font-semibold text-amber-900 flex-1">{root.nom}</span>
                    <span className="text-xs bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded">{root.type}</span>
                  </label>

                  {/* Children */}
                  {children(root.id).map((child) => (
                    <label
                      key={child.id}
                      className="flex items-center gap-2 px-3 py-1.5 ml-6 rounded-xl hover:bg-amber-50 cursor-pointer border-l border-amber-100 ml-6"
                    >
                      <input
                        type="checkbox"
                        checked={checkedIds.has(child.id)}
                        onChange={() => toggle(child.id)}
                        className="accent-amber-600 w-4 h-4 shrink-0"
                      />
                      <span className="text-sm text-gray-700 flex-1">{child.nom}</span>
                    </label>
                  ))}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
