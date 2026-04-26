"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import JeuForm, { type AdminCategorie, type AdminJeuFull } from "./JeuForm";
import RelationsPanel from "./RelationsPanel";

interface AdminJeuRow {
  id: string;
  slug: string;
  nom: string;
  annee: number;
  complexite: string;
  note: number;
  image_url: string | null;
  updated_at: string;
  actif: boolean;
  ean?: string | null;
  youtube_id?: string | null;
  jeux_prix: { marchand: string; prix: string; url: string }[];
  jeux_categories: { categories: { id: string; nom: string } | null }[];
}

interface Props {
  initialJeux: AdminJeuRow[];
  categories: AdminCategorie[];
}

const COMPLEXITE_COLORS: Record<string, string> = {
  "Très simple": "bg-green-100 text-green-700",
  "Simple":      "bg-emerald-100 text-emerald-700",
  "Intermédiaire": "bg-yellow-100 text-yellow-700",
  "Complexe":    "bg-orange-100 text-orange-700",
  "Expert":      "bg-red-100 text-red-600",
};

function prixMin(prix: { prix: string }[]): string {
  const amounts = prix
    .map((p) => parseFloat(p.prix.replace(",", ".").replace(/[^\d.]/g, "")))
    .filter((n) => !isNaN(n) && n > 0);
  if (!amounts.length) return "—";
  return `${Math.min(...amounts).toFixed(2).replace(".", ",")} €`;
}

export default function JeuxManager({ initialJeux, categories }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [jeux, setJeux] = useState<AdminJeuRow[]>(initialJeux);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingJeu, setEditingJeu] = useState<AdminJeuFull | null>(null);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [seoGenerating, setSeoGenerating] = useState<Set<string>>(new Set());
  const [eanSearching, setEanSearching]   = useState<Set<string>>(new Set());
  const [ytSearching, setYtSearching]     = useState<Set<string>>(new Set());

  const filtered = jeux.filter((j) =>
    j.nom.toLowerCase().includes(search.toLowerCase()),
  );

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  async function openEdit(slug: string) {
    const res = await fetch(`/api/admin/jeux/${slug}`);
    if (!res.ok) { showToast("error", "Impossible de charger le jeu"); return; }
    const data = await res.json() as AdminJeuFull;
    setEditingJeu(data);
    setShowForm(true);
  }

  function handleSaved(slug: string) {
    setShowForm(false);
    setEditingJeu(null);
    showToast("success", `Jeu "${slug}" enregistré avec succès`);
    startTransition(() => router.refresh());
    // Refresh local list
    fetch("/api/admin/jeux")
      .then((r) => r.json())
      .then((data) => setJeux(data as AdminJeuRow[]))
      .catch(() => null);
  }

  async function toggleActif(slug: string, current: boolean) {
    const res = await fetch(`/api/admin/jeux/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actif: !current }),
    });
    if (res.ok) {
      setJeux((p) => p.map((j) => j.slug === slug ? { ...j, actif: !current } : j));
    } else {
      showToast("error", "Impossible de modifier l'état");
    }
  }

  async function regenerateSeo(slug: string, nom: string) {
    setSeoGenerating(prev => new Set(prev).add(slug));
    try {
      // Fetch full game data to build rich SEO context
      const jeuRes = await fetch(`/api/admin/jeux/${slug}`);
      if (!jeuRes.ok) throw new Error("Impossible de charger le jeu");
      const jeu = await jeuRes.json() as AdminJeuFull;

      const res = await fetch("/api/admin/seo/generate-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url:     `/jeu/${slug}`,
          type:    "game",
          context: {
            nom:         jeu.nom,
            description: jeu.description,
            joueurs_min: jeu.joueurs_min,
            joueurs_max: jeu.joueurs_max,
            duree_min:   jeu.duree_min,
            duree_max:   jeu.duree_max,
            age_min:     jeu.age_min,
            complexite:  jeu.complexite,
            mecaniques:  jeu.mecaniques,
          },
          force: true,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      showToast("success", `SEO de "${nom}" régénéré`);
    } catch (e) {
      showToast("error", e instanceof Error ? e.message : "Erreur SEO");
    } finally {
      setSeoGenerating(prev => { const s = new Set(prev); s.delete(slug); return s; });
    }
  }

  async function searchEan(slug: string) {
    setEanSearching(prev => new Set(prev).add(slug));
    try {
      const res = await fetch(`/api/admin/jeux/${slug}/fetch-ean`, { method: "POST" });
      const data = await res.json() as { found?: boolean; ean?: string; error?: string; message?: string };
      console.log(`[searchEan] ${slug}:`, data);
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      if (data.found && data.ean) {
        // Update local state immediately
        setJeux(prev => prev.map(j => j.slug === slug ? { ...j, ean: data.ean } : j));
        showToast("success", `EAN trouvé : ${data.ean}`);
      } else {
        showToast("error", data.message ?? "EAN introuvable");
      }
    } catch (e) {
      console.error(`[searchEan] ${slug}:`, e);
      showToast("error", e instanceof Error ? e.message : "Erreur EAN");
    } finally {
      setEanSearching(prev => { const s = new Set(prev); s.delete(slug); return s; });
    }
  }

  async function searchYoutube(slug: string) {
    setYtSearching(prev => new Set(prev).add(slug));
    try {
      const res = await fetch(`/api/admin/jeux/${slug}/fetch-youtube`, { method: "POST" });
      const data = await res.json() as { found?: boolean; youtube_id?: string; error?: string; message?: string };
      console.log(`[searchYoutube] ${slug}:`, data);
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      if (data.found && data.youtube_id) {
        // Update local state immediately
        setJeux(prev => prev.map(j => j.slug === slug ? { ...j, youtube_id: data.youtube_id } : j));
        showToast("success", `Vidéo trouvée : ${data.youtube_id}`);
      } else {
        showToast("error", data.message ?? "Aucune vidéo trouvée");
      }
    } catch (e) {
      console.error(`[searchYoutube] ${slug}:`, e);
      showToast("error", e instanceof Error ? e.message : "Erreur YouTube");
    } finally {
      setYtSearching(prev => { const s = new Set(prev); s.delete(slug); return s; });
    }
  }

  async function confirmDelete() {
    if (!deletingSlug) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/jeux/${deletingSlug}`, { method: "DELETE" });
    setDeleting(false);
    setDeletingSlug(null);
    if (res.ok) {
      setJeux((p) => p.filter((j) => j.slug !== deletingSlug));
      showToast("success", "Jeu supprimé");
    } else {
      const body = await res.json().catch(() => ({})) as { error?: string };
      showToast("error", body.error ?? "Erreur lors de la suppression");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">Admin</p>
          <h1 className="text-3xl font-black text-amber-950">Gestion des jeux</h1>
          <p className="text-gray-500 text-sm mt-1">{jeux.length} jeu{jeux.length > 1 ? "x" : ""} au total</p>
        </div>
        <button
          onClick={() => { setEditingJeu(null); setShowForm(true); }}
          className="btn-primary shrink-0"
        >
          + Nouveau jeu
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`rounded-xl px-4 py-3 text-sm font-medium ${toast.type === "success" ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
          {toast.type === "success" ? "✅" : "⚠"} {toast.msg}
        </div>
      )}

      {/* Search */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="input max-w-sm"
        placeholder="🔍 Rechercher un jeu…"
      />

      {/* Table */}
      <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-amber-100 bg-amber-50/60">
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide w-12">Img</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Nom</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden md:table-cell">Catégories</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Complexité</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Prix min</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Statut</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-50">
              {filtered.map((jeu) => {
                const cats = (jeu.jeux_categories ?? [])
                  .map((jc) => jc.categories?.nom)
                  .filter(Boolean) as string[];

                return (
                  <tr key={jeu.slug} className="hover:bg-amber-50/40 transition-colors">
                    {/* Image */}
                    <td className="px-4 py-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-amber-100 relative shrink-0">
                        {jeu.image_url ? (
                          <Image
                            src={jeu.image_url}
                            alt={jeu.nom}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <span className="flex items-center justify-center h-full text-xl">🎲</span>
                        )}
                      </div>
                    </td>

                    {/* Nom */}
                    <td className="px-4 py-3">
                      <p className="font-semibold text-amber-900">{jeu.nom}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-gray-400 font-mono">{jeu.slug}</p>
                        {jeu.ean && <span className="text-xs bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded font-mono" title={`EAN: ${jeu.ean}`}>EAN ✓</span>}
                        {jeu.youtube_id && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded" title={`YouTube: ${jeu.youtube_id}`}>YT ✓</span>}
                      </div>
                    </td>

                    {/* Catégories */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {cats.slice(0, 3).map((c) => (
                          <span key={c} className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full">{c}</span>
                        ))}
                        {cats.length > 3 && (
                          <span className="text-xs text-gray-400">+{cats.length - 3}</span>
                        )}
                        {cats.length === 0 && <span className="text-xs text-gray-300 italic">Aucune</span>}
                      </div>
                    </td>

                    {/* Complexité */}
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${COMPLEXITE_COLORS[jeu.complexite] ?? "bg-gray-100 text-gray-600"}`}>
                        {jeu.complexite}
                      </span>
                    </td>

                    {/* Prix min */}
                    <td className="px-4 py-3 hidden lg:table-cell text-gray-700 font-medium">
                      {prixMin(jeu.jeux_prix ?? [])}
                    </td>

                    {/* Statut */}
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <button
                        onClick={() => toggleActif(jeu.slug, jeu.actif)}
                        title={jeu.actif ? "Désactiver" : "Activer"}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${jeu.actif ? "bg-emerald-500" : "bg-gray-300"}`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${jeu.actif ? "translate-x-4" : "translate-x-1"}`} />
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => searchEan(jeu.slug)}
                          disabled={eanSearching.has(jeu.slug)}
                          title={jeu.ean ? `EAN: ${jeu.ean} — rechercher` : "Chercher le code EAN (barcode)"}
                          className={`text-xs font-semibold px-2 py-1 rounded-lg transition-colors disabled:opacity-50 ${jeu.ean ? "bg-teal-200 text-teal-800 hover:bg-teal-300" : "bg-teal-100 text-teal-700 hover:bg-teal-200"}`}
                        >
                          {eanSearching.has(jeu.slug) ? "…" : jeu.ean ? "EAN ✓" : "🔍 EAN"}
                        </button>
                        <button
                          onClick={() => searchYoutube(jeu.slug)}
                          disabled={ytSearching.has(jeu.slug)}
                          title={jeu.youtube_id ? `YT: ${jeu.youtube_id} — rechercher` : "Chercher une vidéo YouTube"}
                          className={`text-xs font-semibold px-2 py-1 rounded-lg transition-colors disabled:opacity-50 ${jeu.youtube_id ? "bg-red-200 text-red-800 hover:bg-red-300" : "bg-red-100 text-red-700 hover:bg-red-200"}`}
                        >
                          {ytSearching.has(jeu.slug) ? "…" : jeu.youtube_id ? "YT ✓" : "▶️ YT"}
                        </button>
                        <button
                          onClick={() => regenerateSeo(jeu.slug, jeu.nom)}
                          disabled={seoGenerating.has(jeu.slug)}
                          title="Régénérer le SEO avec Claude"
                          className="text-xs font-semibold px-2 py-1 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 disabled:opacity-50 transition-colors"
                        >
                          {seoGenerating.has(jeu.slug) ? "…" : "🔍 SEO"}
                        </button>
                        <button
                          onClick={() => openEdit(jeu.slug)}
                          className="text-amber-600 hover:text-amber-800 transition-colors p-1.5 rounded-lg hover:bg-amber-100"
                          title="Modifier"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => setDeletingSlug(jeu.slug)}
                          className="text-gray-400 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                          title="Supprimer"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400 text-sm">
                    Aucun jeu trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal formulaire */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-amber-100">
              <h2 className="text-xl font-black text-amber-950">
                {editingJeu ? `Modifier : ${editingJeu.nom}` : "Nouveau jeu"}
              </h2>
              <button
                onClick={() => { setShowForm(false); setEditingJeu(null); }}
                className="text-gray-400 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="px-6 py-6 overflow-y-auto max-h-[calc(100vh-12rem)]">
              <JeuForm
                initialData={editingJeu}
                categories={categories}
                onSaved={handleSaved}
                onCancel={() => { setShowForm(false); setEditingJeu(null); }}
              />
              {editingJeu && (
                <RelationsPanel jeuSlug={editingJeu.slug} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {deletingSlug && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-xl font-black text-amber-950">Supprimer ce jeu ?</h2>
            <p className="text-gray-600 text-sm">
              Le jeu <span className="font-semibold text-amber-800">{deletingSlug}</span> et toutes ses données (prix, catégories) seront définitivement supprimés.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeletingSlug(null)} className="btn-ghost" disabled={deleting}>
                Annuler
              </button>
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
