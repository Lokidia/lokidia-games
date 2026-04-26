"use client";

import { useState, useEffect } from "react";

export interface AdminCategorie {
  id: string;
  slug: string;
  nom: string;
  type: string;
  parent_id: string | null;
}

export interface AdminJeuFull {
  id: string;
  slug: string;
  nom: string;
  annee: number;
  description: string;
  joueurs_min: number;
  joueurs_max: number;
  duree_min: number;
  duree_max: number;
  age_min: number;
  complexite: string;
  note: number;
  mecaniques: string[];
  regles: string[];
  points_forts: string[] | null;
  image_url: string | null;
  spotify_playlist_id?: string | null;
  youtube_id?: string | null;
  ean?: string | null;
  jeux_prix: { marchand: string; url: string; prix: string }[];
  jeux_categories: { categorie_id: string; categories: { id: string; nom: string } | null }[];
}

interface Props {
  initialData?: AdminJeuFull | null;
  categories: AdminCategorie[];
  onSaved: (slug: string) => void;
  onCancel: () => void;
}

const COMPLEXITE_OPTIONS = ["Très simple", "Simple", "Intermédiaire", "Complexe", "Expert"];
const MARCHANDS = ["amazon", "philibert", "cultura", "fnac"] as const;
const MARCHAND_LABELS: Record<string, string> = {
  amazon: "Amazon",
  philibert: "Philibert",
  cultura: "Cultura",
  fnac: "Fnac",
};

function parseSpotifyId(input: string): string {
  const match = input.match(/playlist\/([a-zA-Z0-9]+)/);
  return match ? match[1] : input;
}

function parseYoutubeId(input: string): string {
  const watch = input.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watch) return watch[1];
  const short = input.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (short) return short[1];
  const embed = input.match(/embed\/([a-zA-Z0-9_-]{11})/);
  if (embed) return embed[1];
  return input.trim();
}

function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .trim()
    .replace(/\s+/g, "-");
}

type PrixMap = Record<string, { url: string; prix: string }>;

function buildTree(cats: AdminCategorie[]) {
  const roots = cats.filter((c) => !c.parent_id);
  const children = (parentId: string) => cats.filter((c) => c.parent_id === parentId);
  return { roots, children };
}

export default function JeuForm({ initialData, categories, onSaved, onCancel }: Props) {
  const isEdit = !!initialData;

  // --- form state ---
  const [nom, setNom] = useState(initialData?.nom ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [slugManual, setSlugManual] = useState(isEdit);
  const [annee, setAnnee] = useState(initialData?.annee ?? new Date().getFullYear());
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [joueursMin, setJoueursMin] = useState(initialData?.joueurs_min ?? 2);
  const [joueursMax, setJoueursMax] = useState(initialData?.joueurs_max ?? 4);
  const [dureeMin, setDureeMin] = useState(initialData?.duree_min ?? 30);
  const [dureeMax, setDureeMax] = useState(initialData?.duree_max ?? 60);
  const [ageMin, setAgeMin] = useState(initialData?.age_min ?? 10);
  const [complexite, setComplexite] = useState(initialData?.complexite ?? "Simple");
  const [note, setNote] = useState(initialData?.note ?? 7);
  const [imageUrl, setImageUrl] = useState(initialData?.image_url ?? "");
  const [spotifyInput, setSpotifyInput] = useState(initialData?.spotify_playlist_id ?? "");
  const [youtubeInput, setYoutubeInput] = useState(initialData?.youtube_id ?? "");
  const [ean, setEan] = useState(initialData?.ean ?? "");

  // Prix
  const initPrix = (): PrixMap => {
    const map: PrixMap = { amazon: { url: "", prix: "" }, philibert: { url: "", prix: "" }, cultura: { url: "", prix: "" }, fnac: { url: "", prix: "" } };
    for (const p of initialData?.jeux_prix ?? []) map[p.marchand] = { url: p.url, prix: p.prix };
    return map;
  };
  const [prix, setPrix] = useState<PrixMap>(initPrix);

  // Mecaniques
  const [mecaniques, setMecaniques] = useState<string[]>(initialData?.mecaniques ?? []);
  const [mecInput, setMecInput] = useState("");

  // Regles
  const [regles, setRegles] = useState<string[]>(initialData?.regles ?? [""]);

  // Categories
  const initCatIds = new Set(
    initialData?.jeux_categories?.map((jc) => jc.categorie_id) ?? [],
  );
  const [selectedCatIds, setSelectedCatIds] = useState<Set<string>>(initCatIds);

  // Points forts
  const [pointsForts, setPointsForts] = useState<string[]>(initialData?.points_forts ?? []);
  const [generatingPF, setGeneratingPF] = useState(false);

  // Règles IA
  const [generatingRegles, setGeneratingRegles] = useState(false);

  // Auto-catégorisation
  const [generatingCats, setGeneratingCats] = useState(false);
  const [catSuggestions, setCatSuggestions] = useState<{ id: string; nom: string }[] | null>(null);
  const [catSuggestSelected, setCatSuggestSelected] = useState<Set<string>>(new Set());

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-slug from nom
  useEffect(() => {
    if (!slugManual) {
      queueMicrotask(() => setSlug(slugify(nom)));
    }
  }, [nom, slugManual]);

  function toggleCat(id: string) {
    setSelectedCatIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function addMec() {
    const v = mecInput.trim();
    if (v && !mecaniques.includes(v)) setMecaniques((p) => [...p, v]);
    setMecInput("");
  }

  async function generatePointsForts() {
    setGeneratingPF(true);
    try {
      const res = await fetch("/api/admin/generate/points-forts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom, description,
          joueurs_min: joueursMin, joueurs_max: joueursMax,
          duree_min: dureeMin, duree_max: dureeMax,
          complexite, mecaniques,
        }),
      });
      const data = await res.json() as { points?: string[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      if (data.points) setPointsForts(data.points);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setGeneratingPF(false);
    }
  }

  async function generateRegles() {
    setGeneratingRegles(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/generate/regles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom, description, mecaniques }),
      });
      const data = await res.json() as { regles?: string[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      if (data.regles) setRegles(data.regles);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setGeneratingRegles(false);
    }
  }

  async function autoCategories() {
    setGeneratingCats(true);
    setCatSuggestions(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/generate/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom, description, mecaniques,
          categories: categories.map((c) => ({ id: c.id, nom: c.nom })),
        }),
      });
      const data = await res.json() as { ids?: string[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      const suggested = (data.ids ?? [])
        .map((id) => categories.find((c) => c.id === id))
        .filter(Boolean) as AdminCategorie[];
      setCatSuggestions(suggested);
      setCatSuggestSelected(new Set(suggested.map((c) => c.id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setGeneratingCats(false);
    }
  }

  function applyCatSuggestions() {
    setSelectedCatIds((prev) => {
      const next = new Set(prev);
      catSuggestSelected.forEach((id) => next.add(id));
      return next;
    });
    setCatSuggestions(null);
  }

  function toggleCatSuggestion(id: string) {
    setCatSuggestSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void save();
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        slug, nom, annee: Number(annee), description,
        joueurs_min: Number(joueursMin), joueurs_max: Number(joueursMax),
        duree_min: Number(dureeMin), duree_max: Number(dureeMax),
        age_min: Number(ageMin), complexite, note: Number(note),
        mecaniques, regles: regles.filter((r) => r.trim()),
        points_forts: pointsForts.filter((p) => p.trim()),
        image_url: imageUrl || null,
        spotify_playlist_id: spotifyInput.trim() ? parseSpotifyId(spotifyInput.trim()) : null,
        youtube_id: youtubeInput.trim() ? parseYoutubeId(youtubeInput.trim()) : null,
        ean: ean.trim() || null,
        prix,
        categories: Array.from(selectedCatIds),
      };

      const url = isEdit ? `/api/admin/jeux/${initialData!.slug}` : "/api/admin/jeux";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }

      onSaved(slug);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  const { roots, children } = buildTree(categories);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          ⚠ {error}
        </div>
      )}

      {/* ── Infos de base ── */}
      <section>
        <h3 className="text-sm font-bold text-amber-800 uppercase tracking-widest mb-4">
          Informations de base
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label">Nom du jeu *</label>
            <input
              required value={nom} onChange={(e) => setNom(e.target.value)}
              className="input" placeholder="Ex : Les Aventuriers du Rail"
            />
          </div>
          <div>
            <label className="label">Slug (URL)</label>
            <input
              value={slug}
              onChange={(e) => { setSlugManual(true); setSlug(e.target.value); }}
              className="input font-mono text-sm"
              placeholder="les-aventuriers-du-rail"
            />
          </div>
          <div>
            <label className="label">Année</label>
            <input
              type="number" value={annee} onChange={(e) => setAnnee(Number(e.target.value))}
              className="input" min={1900} max={2030}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">URL de l&apos;image</label>
            <input
              value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
              className="input" placeholder="https://…"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Playlist Spotify <span className="text-gray-400 font-normal normal-case">(URL ou ID)</span></label>
            <input
              value={spotifyInput}
              onChange={(e) => setSpotifyInput(e.target.value)}
              className="input"
              placeholder="https://open.spotify.com/playlist/… ou ID"
            />
          </div>
          <div>
            <label className="label">Vidéo YouTube <span className="text-gray-400 font-normal normal-case">(URL ou ID)</span></label>
            <input
              value={youtubeInput}
              onChange={(e) => setYoutubeInput(e.target.value)}
              className="input"
              placeholder="https://youtu.be/… ou ID"
            />
            {youtubeInput.trim() && (
              <p className="text-xs text-gray-400 mt-1 font-mono">ID : {parseYoutubeId(youtubeInput.trim())}</p>
            )}
          </div>
          <div>
            <label className="label">Code EAN <span className="text-gray-400 font-normal normal-case">(code-barres boîte)</span></label>
            <input
              value={ean}
              onChange={(e) => setEan(e.target.value.replace(/\D/g, "").slice(0, 13))}
              className="input font-mono"
              placeholder="ex : 3558380063476"
              inputMode="numeric"
              maxLength={13}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Description *</label>
            <textarea
              required value={description} onChange={(e) => setDescription(e.target.value)}
              rows={4} className="input resize-none"
              placeholder="Description du jeu…"
            />
          </div>
        </div>
      </section>

      {/* ── Caractéristiques ── */}
      <section>
        <h3 className="text-sm font-bold text-amber-800 uppercase tracking-widest mb-4">
          Caractéristiques
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="label">Joueurs min</label>
            <input type="number" value={joueursMin} onChange={(e) => setJoueursMin(Number(e.target.value))} className="input" min={1} />
          </div>
          <div>
            <label className="label">Joueurs max</label>
            <input type="number" value={joueursMax} onChange={(e) => setJoueursMax(Number(e.target.value))} className="input" min={1} />
          </div>
          <div>
            <label className="label">Durée min (min)</label>
            <input type="number" value={dureeMin} onChange={(e) => setDureeMin(Number(e.target.value))} className="input" min={1} />
          </div>
          <div>
            <label className="label">Durée max (min)</label>
            <input type="number" value={dureeMax} onChange={(e) => setDureeMax(Number(e.target.value))} className="input" min={1} />
          </div>
          <div>
            <label className="label">Âge min</label>
            <input type="number" value={ageMin} onChange={(e) => setAgeMin(Number(e.target.value))} className="input" min={0} />
          </div>
          <div>
            <label className="label">Complexité</label>
            <select value={complexite} onChange={(e) => setComplexite(e.target.value)} className="input">
              {COMPLEXITE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Note (0–10)</label>
            <input type="number" value={note} onChange={(e) => setNote(Number(e.target.value))} className="input" min={0} max={10} step={0.1} />
          </div>
        </div>
      </section>

      {/* ── Mécaniques ── */}
      <section>
        <h3 className="text-sm font-bold text-amber-800 uppercase tracking-widest mb-4">Mécaniques</h3>
        <div className="flex gap-2 mb-3">
          <input
            value={mecInput}
            onChange={(e) => setMecInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addMec(); } }}
            className="input flex-1" placeholder="Ex : Placement de routes"
          />
          <button type="button" onClick={addMec} className="btn-secondary">Ajouter</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {mecaniques.map((m) => (
            <span key={m} className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-sm px-3 py-1 rounded-full">
              {m}
              <button type="button" onClick={() => setMecaniques((p) => p.filter((x) => x !== m))}
                className="text-amber-500 hover:text-amber-900 ml-1 font-bold leading-none">×</button>
            </span>
          ))}
        </div>
      </section>

      {/* ── Points forts ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-amber-800 uppercase tracking-widest">
            Pourquoi ce jeu ? <span className="text-gray-400 font-normal normal-case">(points forts)</span>
          </h3>
          <button
            type="button"
            onClick={() => void generatePointsForts()}
            disabled={generatingPF || !nom || !description}
            className="flex items-center gap-1.5 text-xs font-semibold bg-violet-100 text-violet-700 hover:bg-violet-200 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors"
          >
            {generatingPF ? (
              <><span className="animate-spin">⏳</span> Génération…</>
            ) : (
              <>✨ Générer avec IA</>
            )}
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {pointsForts.map((p, i) => (
            <div key={i} className="flex gap-2 items-center">
              <span className="text-emerald-600 font-bold shrink-0">✔</span>
              <input
                value={p}
                onChange={(e) => setPointsForts((prev) => prev.map((x, j) => j === i ? e.target.value : x))}
                className="input flex-1 text-sm"
                placeholder={`Point fort ${i + 1}…`}
              />
              <button
                type="button"
                onClick={() => setPointsForts((prev) => prev.filter((_, j) => j !== i))}
                className="text-gray-400 hover:text-red-500 text-xl leading-none"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setPointsForts((p) => [...p, ""])}
            className="btn-secondary self-start mt-1"
          >
            + Ajouter un point
          </button>
        </div>
      </section>

      {/* ── Règles ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-amber-800 uppercase tracking-widest">
            Règles du jeu
          </h3>
          <button
            type="button"
            onClick={() => void generateRegles()}
            disabled={generatingRegles || !nom}
            className="flex items-center gap-1.5 text-xs font-semibold bg-violet-100 text-violet-700 hover:bg-violet-200 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors"
          >
            {generatingRegles ? (
              <><span className="animate-spin">⏳</span> Génération…</>
            ) : (
              <>✨ Générer avec IA</>
            )}
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {regles.map((r, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span className="bg-amber-700 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-2">
                {i + 1}
              </span>
              <textarea
                value={r}
                onChange={(e) => setRegles((p) => p.map((x, j) => j === i ? e.target.value : x))}
                rows={2} className="input flex-1 resize-none text-sm"
                placeholder={`Étape ${i + 1}…`}
              />
              <button
                type="button"
                onClick={() => setRegles((p) => p.filter((_, j) => j !== i))}
                className="text-gray-400 hover:text-red-500 mt-2 text-xl leading-none"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setRegles((p) => [...p, ""])}
            className="btn-secondary self-start mt-1"
          >
            + Ajouter une règle
          </button>
        </div>
      </section>

      {/* ── Prix ── */}
      <section>
        <h3 className="text-sm font-bold text-amber-800 uppercase tracking-widest mb-4">
          Prix par boutique
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {MARCHANDS.map((m) => (
            <div key={m} className="bg-amber-50 rounded-xl p-4 flex flex-col gap-2">
              <p className="font-semibold text-amber-900 text-sm">{MARCHAND_LABELS[m]}</p>
              <input
                value={prix[m]?.prix ?? ""}
                onChange={(e) => setPrix((p) => ({ ...p, [m]: { ...p[m], prix: e.target.value } }))}
                className="input text-sm" placeholder="Ex : 34,99€"
              />
              <input
                value={prix[m]?.url ?? ""}
                onChange={(e) => setPrix((p) => ({ ...p, [m]: { ...p[m], url: e.target.value } }))}
                className="input text-sm" placeholder="URL du produit"
              />
            </div>
          ))}
        </div>
      </section>

      {/* ── Catégories ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-amber-800 uppercase tracking-widest">
            Catégories ({selectedCatIds.size} sélectionnée{selectedCatIds.size > 1 ? "s" : ""})
          </h3>
          <button
            type="button"
            onClick={() => void autoCategories()}
            disabled={generatingCats || !nom || categories.length === 0}
            className="flex items-center gap-1.5 text-xs font-semibold bg-violet-100 text-violet-700 hover:bg-violet-200 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors"
          >
            {generatingCats ? (
              <><span className="animate-spin">⏳</span> Analyse…</>
            ) : (
              <>✨ Suggérer avec IA</>
            )}
          </button>
        </div>

        {catSuggestions && (
          <div className="mb-4 rounded-xl border border-violet-200 bg-violet-50 p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="text-sm font-bold text-violet-900">Suggestions IA</p>
                <p className="text-xs text-violet-700">
                  Vérifie les catégories avant de les ajouter au jeu.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCatSuggestions(null)}
                className="text-violet-400 hover:text-violet-700 text-xl leading-none"
                aria-label="Fermer les suggestions"
              >
                ×
              </button>
            </div>

            {catSuggestions.length === 0 ? (
              <p className="text-sm text-violet-700">Aucune catégorie pertinente trouvée.</p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {catSuggestions.map((cat) => (
                    <label
                      key={cat.id}
                      className="inline-flex items-center gap-2 rounded-full bg-white border border-violet-200 px-3 py-1.5 text-sm text-violet-900 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={catSuggestSelected.has(cat.id)}
                        onChange={() => toggleCatSuggestion(cat.id)}
                        className="accent-violet-600"
                      />
                      {cat.nom}
                    </label>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={applyCatSuggestions}
                    disabled={catSuggestSelected.size === 0}
                    className="btn-primary disabled:opacity-50"
                  >
                    Appliquer la sélection
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatSuggestSelected(new Set(catSuggestions.map((cat) => cat.id)))}
                    className="btn-secondary"
                  >
                    Tout sélectionner
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto border border-amber-100 rounded-xl p-4">
          {roots.map((root) => (
            <div key={root.id}>
              <label className="flex items-center gap-2 cursor-pointer py-1">
                <input
                  type="checkbox"
                  checked={selectedCatIds.has(root.id)}
                  onChange={() => toggleCat(root.id)}
                  className="accent-amber-600 w-4 h-4"
                />
                <span className="font-semibold text-amber-900 text-sm">{root.nom}</span>
              </label>
              {children(root.id).map((child) => (
                <label key={child.id} className="flex items-center gap-2 cursor-pointer py-0.5 pl-6">
                  <input
                    type="checkbox"
                    checked={selectedCatIds.has(child.id)}
                    onChange={() => toggleCat(child.id)}
                    className="accent-amber-600 w-4 h-4"
                  />
                  <span className="text-gray-700 text-sm">{child.nom}</span>
                </label>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ── Actions ── */}
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-amber-100">
        <button type="button" onClick={onCancel} className="btn-ghost">
          Annuler
        </button>
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "Enregistrement…" : isEdit ? "Enregistrer les modifications" : "Créer le jeu"}
        </button>
      </div>
    </form>
  );
}
