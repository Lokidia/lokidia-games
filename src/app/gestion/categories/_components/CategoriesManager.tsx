"use client";

import { useState } from "react";

interface AdminCategorie {
  id: string;
  slug: string;
  nom: string;
  type: string;
  parent_id: string | null;
  actif: boolean;
  position: number;
}

interface Props {
  initialCategories: AdminCategorie[];
}

const TYPE_OPTIONS = ["category", "theme", "mechanism", "player_count", "duration", "age", "award", "other"];

function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .trim()
    .replace(/\s+/g, "-");
}

interface FormState {
  nom: string;
  slug: string;
  type: string;
  parent_id: string | null;
}

function defaultForm(parentId: string | null = null): FormState {
  return { nom: "", slug: "", type: "category", parent_id: parentId };
}

export default function CategoriesManager({ initialCategories }: Props) {
  const [cats, setCats] = useState<AdminCategorie[]>(initialCategories);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [editingCat, setEditingCat] = useState<AdminCategorie | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm());
  const [slugManual, setSlugManual] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const roots = cats
    .filter((c) => !c.parent_id)
    .sort((a, b) => a.position - b.position || a.nom.localeCompare(b.nom));
  const children = (pid: string) =>
    cats
      .filter((c) => c.parent_id === pid)
      .sort((a, b) => a.position - b.position || a.nom.localeCompare(b.nom));

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  function openCreate(parentId: string | null = null) {
    setEditingCat(null);
    setForm(defaultForm(parentId));
    setSlugManual(false);
    setShowForm(true);
  }

  async function toggleActif(cat: AdminCategorie) {
    const res = await fetch(`/api/admin/categories/${cat.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actif: !cat.actif }),
    });
    if (res.ok) {
      setCats((p) => p.map((c) => c.id === cat.id ? { ...c, actif: !cat.actif } : c));
    } else {
      showToast("error", "Impossible de modifier l'état");
    }
  }

  async function moveCategory(cat: AdminCategorie, direction: "up" | "down") {
    const siblings = cats
      .filter((c) => c.parent_id === cat.parent_id)
      .sort((a, b) => a.position - b.position || a.nom.localeCompare(b.nom));
    const idx = siblings.findIndex((c) => c.id === cat.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= siblings.length) return;
    const other = siblings[swapIdx];

    const [posA, posB] = [cat.position, other.position];
    const newPosA = posB === posA ? posA + (direction === "up" ? -1 : 1) : posB;
    const newPosB = posA;

    await Promise.all([
      fetch(`/api/admin/categories/${cat.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position: newPosA }),
      }),
      fetch(`/api/admin/categories/${other.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position: newPosB }),
      }),
    ]);

    setCats((p) =>
      p.map((c) => {
        if (c.id === cat.id) return { ...c, position: newPosA };
        if (c.id === other.id) return { ...c, position: newPosB };
        return c;
      }),
    );
  }

  function openEdit(cat: AdminCategorie) {
    setEditingCat(cat);
    setForm({ nom: cat.nom, slug: cat.slug, type: cat.type, parent_id: cat.parent_id });
    setSlugManual(true);
    setShowForm(true);
  }

  function handleNomChange(v: string) {
    setForm((p) => ({ ...p, nom: v, slug: slugManual ? p.slug : slugify(v) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { nom: form.nom, slug: form.slug, type: form.type, parent_id: form.parent_id || null };
      let res: Response;
      if (editingCat) {
        res = await fetch(`/api/admin/categories/${editingCat.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/admin/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }

      const saved = await res.json() as AdminCategorie;

      if (editingCat) {
        setCats((p) => p.map((c) => c.id === saved.id ? saved : c));
        showToast("success", `Catégorie "${saved.nom}" mise à jour`);
      } else {
        setCats((p) => [...p, saved].sort((a, b) => a.nom.localeCompare(b.nom)));
        showToast("success", `Catégorie "${saved.nom}" créée`);
        if (saved.parent_id) setExpanded((p) => new Set(p).add(saved.parent_id!));
      }

      setShowForm(false);
      setEditingCat(null);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deletingId) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/categories/${deletingId}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      setCats((p) => p.filter((c) => c.id !== deletingId).map((c) =>
        c.parent_id === deletingId
          ? { ...c, parent_id: cats.find((x) => x.id === deletingId)?.parent_id ?? null }
          : c,
      ));
      showToast("success", "Catégorie supprimée");
    } else {
      const body = await res.json().catch(() => ({})) as { error?: string };
      showToast("error", body.error ?? "Erreur lors de la suppression");
    }
    setDeletingId(null);
  }

  function toggleExpand(id: string) {
    setExpanded((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function CatRow({ cat, depth = 0 }: { cat: AdminCategorie; depth?: number }) {
    const kids = children(cat.id);
    const isExpanded = expanded.has(cat.id);

    return (
      <li>
        <div
          className={`flex items-center gap-2 px-4 py-2.5 hover:bg-amber-50/60 transition-colors group rounded-xl ${depth > 0 ? "ml-6" : ""}`}
        >
          {/* Expand toggle */}
          <button
            type="button"
            onClick={() => toggleExpand(cat.id)}
            className={`w-5 h-5 flex items-center justify-center text-gray-400 shrink-0 transition-transform ${kids.length === 0 ? "opacity-0 pointer-events-none" : ""} ${isExpanded ? "rotate-90" : ""}`}
          >
            ▶
          </button>

          {/* Icon */}
          <span className="text-base shrink-0">{depth === 0 ? "📁" : "📄"}</span>

          {/* Name */}
          <div className="flex-1 min-w-0">
            <span className={`font-medium text-sm ${depth === 0 ? "text-amber-900" : "text-gray-700"}`}>
              {cat.nom}
            </span>
            <span className="ml-2 text-xs text-gray-400 font-mono hidden sm:inline">{cat.slug}</span>
          </div>

          {/* Type badge */}
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full hidden md:inline-flex shrink-0">
            {cat.type}
          </span>

          {/* Children count */}
          {kids.length > 0 && (
            <span className="text-xs text-gray-400 shrink-0">{kids.length} enfant{kids.length > 1 ? "s" : ""}</span>
          )}

          {/* Toggle actif */}
          <button
            onClick={() => toggleActif(cat)}
            title={cat.actif ? "Désactiver" : "Activer"}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${cat.actif ? "bg-emerald-500" : "bg-gray-300"}`}
          >
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${cat.actif ? "translate-x-4" : "translate-x-1"}`} />
          </button>

          {/* Actions (visible on hover) */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              onClick={() => moveCategory(cat, "up")}
              className="p-1 rounded text-gray-400 hover:bg-amber-100 hover:text-amber-700 text-xs leading-none"
              title="Monter"
            >
              ↑
            </button>
            <button
              onClick={() => moveCategory(cat, "down")}
              className="p-1 rounded text-gray-400 hover:bg-amber-100 hover:text-amber-700 text-xs leading-none"
              title="Descendre"
            >
              ↓
            </button>
            <button
              onClick={() => openCreate(cat.id)}
              className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-100 text-xs"
              title="Ajouter une sous-catégorie"
            >
              +
            </button>
            <button
              onClick={() => openEdit(cat)}
              className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-100"
              title="Modifier"
            >
              ✏️
            </button>
            <button
              onClick={() => setDeletingId(cat.id)}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600"
              title="Supprimer"
            >
              🗑️
            </button>
          </div>
        </div>

        {/* Children */}
        {kids.length > 0 && isExpanded && (
          <ul className="border-l border-amber-100 ml-8">
            {kids.map((kid) => <CatRow key={kid.id} cat={kid} depth={depth + 1} />)}
          </ul>
        )}
      </li>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">Admin</p>
          <h1 className="text-3xl font-black text-amber-950">Catégories</h1>
          <p className="text-gray-500 text-sm mt-1">
            {roots.length} racine{roots.length > 1 ? "s" : ""} · {cats.length} total
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => {
              setExpanded(new Set(cats.filter((c) => !c.parent_id).map((c) => c.id)));
            }}
            className="btn-ghost text-sm"
          >
            Tout développer
          </button>
          <button onClick={() => openCreate()} className="btn-primary">
            + Nouvelle catégorie
          </button>
        </div>
      </div>

      {toast && (
        <div className={`rounded-xl px-4 py-3 text-sm font-medium ${toast.type === "success" ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
          {toast.type === "success" ? "✅" : "⚠"} {toast.msg}
        </div>
      )}

      {/* Tree */}
      <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-amber-100 bg-amber-50/50">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Arborescence</p>
        </div>
        {roots.length === 0 ? (
          <p className="px-6 py-10 text-center text-gray-400 text-sm">Aucune catégorie. Commencez par en créer une.</p>
        ) : (
          <ul className="py-2 px-2">
            {roots.map((root) => <CatRow key={root.id} cat={root} />)}
          </ul>
        )}
      </div>

      {/* Modal formulaire */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-amber-100">
              <h2 className="text-xl font-black text-amber-950">
                {editingCat ? `Modifier : ${editingCat.nom}` : "Nouvelle catégorie"}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
              <div>
                <label className="label">Nom *</label>
                <input
                  required value={form.nom}
                  onChange={(e) => handleNomChange(e.target.value)}
                  className="input"
                  placeholder="Ex : Stratégie"
                />
              </div>
              <div>
                <label className="label">Slug</label>
                <input
                  value={form.slug}
                  onChange={(e) => { setSlugManual(true); setForm((p) => ({ ...p, slug: e.target.value })); }}
                  className="input font-mono text-sm"
                />
              </div>
              <div>
                <label className="label">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                  className="input"
                >
                  {TYPE_OPTIONS.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Catégorie parente</label>
                <select
                  value={form.parent_id ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, parent_id: e.target.value || null }))}
                  className="input"
                >
                  <option value="">— Aucune (racine) —</option>
                  {cats
                    .filter((c) => c.id !== editingCat?.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>{c.nom}</option>
                    ))}
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">Annuler</button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? "Enregistrement…" : editingCat ? "Modifier" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-xl font-black text-amber-950">Supprimer cette catégorie ?</h2>
            <p className="text-gray-600 text-sm">
              La catégorie <span className="font-semibold text-amber-800">{cats.find((c) => c.id === deletingId)?.nom}</span> sera supprimée.
              Ses sous-catégories seront rattachées à son parent.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeletingId(null)} className="btn-ghost" disabled={deleting}>Annuler</button>
              <button onClick={confirmDelete} disabled={deleting} className="bg-red-600 text-white font-semibold px-4 py-2 rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors">
                {deleting ? "Suppression…" : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
