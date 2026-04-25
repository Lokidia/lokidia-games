"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { SeoPage } from "@/lib/seo/types";

/* ─── Types ─── */

interface RecordSummary {
  slug: string;
  status: string;
  generated_at: string;
  updated_at: string;
  payload_json: {
    title?: string;
    meta?: string;
    h1?: string;
    intro?: string;
    sections?: unknown[];
  };
}

interface SiteUrlItem {
  url: string;
  label: string;
  type: "static" | "category" | "game";
  context: Record<string, unknown>;
  record: RecordSummary | null;
}

interface PagesData {
  static: SiteUrlItem[];
  categories: SiteUrlItem[];
  games: SiteUrlItem[];
  stats: { total: number; enriched: number };
}

type FilterMode = "all" | "missing";

/* ─── Helpers ─── */

function urlToSlug(url: string): string {
  return (url.startsWith("/") ? url.slice(1) : url) || "home";
}

function hasContent(r: RecordSummary | null) {
  if (!r) return { title: false, meta: false, h1: false, content: false };
  const p = r.payload_json;
  return {
    title:   !!p.title,
    meta:    !!p.meta,
    h1:      !!p.h1,
    content: !!p.intro && Array.isArray(p.sections) && p.sections.length > 0,
  };
}

function Indicator({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded ${
        ok
          ? "bg-emerald-50 text-emerald-700"
          : "bg-red-50 text-red-500"
      }`}
    >
      {ok ? "✅" : "❌"} {label}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

/* ─── Edit Modal ─── */

function EditModal({
  item,
  onClose,
  onSaved,
}: {
  item: SiteUrlItem & { record: RecordSummary };
  onClose: () => void;
  onSaved: (record: RecordSummary) => void;
}) {
  const p = item.record.payload_json;
  const [title,    setTitle]    = useState(p.title ?? "");
  const [meta,     setMeta]     = useState(p.meta ?? "");
  const [h1,       setH1]       = useState(p.h1 ?? "");
  const [intro,    setIntro]    = useState(p.intro ?? "");
  const [sections, setSections] = useState<{ h2: string; text: string }[]>(
    Array.isArray(p.sections) ? (p.sections as { h2: string; text: string }[]) : [],
  );
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  function updateSection(i: number, field: "h2" | "text", value: string) {
    setSections((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const payload: Partial<SeoPage> = { title, meta, h1, intro, sections };
      const res = await fetch("/api/admin/seo/update-page", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: item.record.slug, payload }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Erreur inconnue" }));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const updated = await res.json();
      onSaved({ ...item.record, payload_json: { title, meta, h1, intro, sections }, status: "draft", updated_at: updated.updated_at });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-8 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <p className="text-xs font-bold text-amber-600 uppercase tracking-widest">Éditer SEO</p>
            <h2 className="text-lg font-bold text-gray-900">{item.label}</h2>
            <p className="text-xs text-gray-400 font-mono mt-0.5">{item.url}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1" aria-label="Fermer">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          <Field label="Title" hint={`${title.length}/60`} hintRed={title.length > 60}>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Meta description" hint={`${meta.length}/155`} hintRed={meta.length > 155}>
            <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" rows={2} value={meta} onChange={(e) => setMeta(e.target.value)} />
          </Field>
          <Field label="H1">
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" value={h1} onChange={(e) => setH1(e.target.value)} />
          </Field>
          <Field label="Introduction" hint={`${intro.split(/\s+/).filter(Boolean).length} mots`}>
            <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" rows={4} value={intro} onChange={(e) => setIntro(e.target.value)} />
          </Field>
          {sections.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Sections H2</p>
              <div className="space-y-3">
                {sections.map((s, i) => (
                  <div key={i} className="bg-amber-50 rounded-xl p-4 space-y-2">
                    <p className="text-xs font-bold text-amber-700">Section {i + 1}</p>
                    <input className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="Titre H2" value={s.h2} onChange={(e) => updateSection(i, "h2", e.target.value)} />
                    <textarea className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" rows={3} placeholder="Contenu" value={s.text} onChange={(e) => updateSection(i, "text", e.target.value)} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
          {error ? <p className="text-xs text-red-500 flex-1 truncate">⚠ {error}</p> : <span />}
          <div className="flex gap-2 shrink-0">
            <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:border-gray-400 transition-colors">Annuler</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-xl transition-colors disabled:opacity-50">
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, hintRed = false, children }: { label: string; hint?: string; hintRed?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">{label}</p>
        {hint && <span className={`text-xs ${hintRed ? "text-red-500" : "text-gray-400"}`}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

/* ─── URL Row ─── */

function UrlRow({
  item,
  generating,
  onGenerate,
  onEdit,
}: {
  item: SiteUrlItem;
  generating: boolean;
  onGenerate: (force: boolean) => void;
  onEdit: () => void;
}) {
  const ind = hasContent(item.record);
  const isEnriched = item.record !== null;

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center gap-2 py-3 px-4 rounded-xl border transition-colors ${
      isEnriched ? "bg-white border-gray-100 hover:border-amber-200" : "bg-red-50/40 border-red-100 hover:border-red-200"
    }`}>
      {/* Left: url + label */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <code className="text-xs text-gray-400 font-mono truncate max-w-[280px]">{item.url}</code>
          <span className="text-sm font-semibold text-gray-800 truncate">{item.label}</span>
        </div>
        <div className="flex flex-wrap gap-1 mt-1.5">
          <Indicator ok={ind.title}   label="Title" />
          <Indicator ok={ind.meta}    label="Meta" />
          <Indicator ok={ind.h1}      label="H1" />
          <Indicator ok={ind.content} label="Contenu" />
          {item.record && (
            <span className="text-xs text-gray-400 ml-1 self-center">
              · {formatDate(item.record.updated_at)}
            </span>
          )}
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex gap-1.5 shrink-0">
        {!isEnriched ? (
          <button
            onClick={() => onGenerate(false)}
            disabled={generating}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {generating ? <Spinner /> : "✨"} Générer
          </button>
        ) : (
          <button
            onClick={() => onGenerate(true)}
            disabled={generating}
            title="Régénérer avec Claude"
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-600 border border-gray-200 hover:border-amber-400 hover:text-amber-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {generating ? <Spinner /> : "🔄"} Régénérer
          </button>
        )}
        {isEnriched && (
          <button
            onClick={onEdit}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-600 border border-gray-200 hover:border-blue-400 hover:text-blue-700 rounded-lg transition-colors"
          >
            ✏️ Éditer
          </button>
        )}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

/* ─── Section Block ─── */

function SectionBlock({
  title,
  emoji,
  items,
  generating,
  onGenerate,
  onEdit,
  defaultOpen = true,
}: {
  title: string;
  emoji: string;
  items: SiteUrlItem[];
  generating: Set<string>;
  onGenerate: (item: SiteUrlItem, force: boolean) => void;
  onEdit: (item: SiteUrlItem) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const enriched = items.filter((i) => i.record !== null).length;

  if (items.length === 0) return null;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{emoji}</span>
          <div className="text-left">
            <p className="font-bold text-gray-900">{title}</p>
            <p className="text-xs text-gray-500">
              {enriched}/{items.length} enrichies
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-32 bg-gray-100 rounded-full h-2">
            <div
              className="bg-amber-500 h-2 rounded-full transition-all"
              style={{ width: `${items.length > 0 ? (enriched / items.length) * 100 : 0}%` }}
            />
          </div>
          <span className="text-gray-400 text-sm">{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-2">
          {items.map((item) => (
            <UrlRow
              key={item.url}
              item={item}
              generating={generating.has(item.url)}
              onGenerate={(force) => onGenerate(item, force)}
              onEdit={() => onEdit(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ─── */

export default function SeoManager() {
  const [data, setData] = useState<PagesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState<Set<string>>(new Set());
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 });
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [search, setSearch] = useState("");
  const [editItem, setEditItem] = useState<(SiteUrlItem & { record: RecordSummary }) | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState<string | null>(null);
  const abortRef = useRef(false);

  /* Load all pages */
  useEffect(() => {
    fetch("/api/admin/seo/pages")
      .then((r) => r.json())
      .then((d: PagesData) => { setData(d); setLoading(false); })
      .catch((e) => { setError(String(e)); setLoading(false); });
  }, []);

  /* Update a record in local state */
  const updateRecord = useCallback((url: string, record: RecordSummary) => {
    setData((prev) => {
      if (!prev) return prev;
      function patchList(list: SiteUrlItem[]) {
        return list.map((i) => (i.url === url ? { ...i, record } : i));
      }
      const newData = {
        ...prev,
        static: patchList(prev.static),
        categories: patchList(prev.categories),
        games: patchList(prev.games),
      };
      const enriched = [...newData.static, ...newData.categories, ...newData.games].filter((i) => i.record !== null).length;
      return { ...newData, stats: { ...prev.stats, enriched } };
    });
  }, []);

  /* Generate one page */
  const generate = useCallback(
    async (item: SiteUrlItem, force = false) => {
      if (generating.has(item.url)) return;
      setGenerating((prev) => new Set(prev).add(item.url));
      try {
        const res = await fetch("/api/admin/seo/generate-page", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: item.url, type: item.type, context: item.context, force }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        const record = await res.json();
        updateRecord(item.url, {
          slug: urlToSlug(item.url),
          status: record.status ?? "generated",
          generated_at: record.generated_at ?? new Date().toISOString(),
          updated_at: record.updated_at ?? new Date().toISOString(),
          payload_json: record.payload_json ?? {},
        });
      } finally {
        setGenerating((prev) => { const s = new Set(prev); s.delete(item.url); return s; });
      }
    },
    [generating, updateRecord],
  );

  /* Bulk generate all missing */
  async function generateAll() {
    if (!data || bulkRunning) return;
    const all = [...data.static, ...data.categories, ...data.games];
    const missing = all.filter((i) => !i.record);
    if (missing.length === 0) return;

    abortRef.current = false;
    setBulkRunning(true);
    setBulkError(null);
    setBulkProgress({ done: 0, total: missing.length });

    for (let i = 0; i < missing.length; i++) {
      if (abortRef.current) break;
      await generate(missing[i], false).catch(() => {});
      setBulkProgress({ done: i + 1, total: missing.length });
    }

    setBulkRunning(false);
  }

  /* Refresh list from Supabase, detect new pages */
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshMsg(null);
    try {
      const res = await fetch("/api/admin/seo/pages");
      const fresh: PagesData = await res.json();
      if (data) {
        const knownUrls = new Set(
          [...data.static, ...data.categories, ...data.games].map((i) => i.url),
        );
        const newPages = [...fresh.static, ...fresh.categories, ...fresh.games].filter(
          (i) => !knownUrls.has(i.url),
        );
        setRefreshMsg(
          newPages.length > 0
            ? `${newPages.length} nouvelle(s) page(s) détectée(s)`
            : "Liste à jour, aucune nouveauté",
        );
      }
      setData(fresh);
    } catch {
      setRefreshMsg("Erreur lors de l'actualisation");
    } finally {
      setRefreshing(false);
      setTimeout(() => setRefreshMsg(null), 4000);
    }
  }, [data]);

  /* Apply filters */
  function applyFilters(items: SiteUrlItem[]): SiteUrlItem[] {
    let result = items;
    if (filter === "missing") result = result.filter((i) => !i.record);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (i) => i.url.toLowerCase().includes(q) || i.label.toLowerCase().includes(q),
      );
    }
    return result;
  }

  /* ── Render ── */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
        <span className="ml-2 text-gray-500">Chargement des pages…</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
        <p className="text-red-700 font-semibold">Erreur de chargement</p>
        <p className="text-red-500 text-sm mt-1">{error}</p>
      </div>
    );
  }

  const { stats } = data;
  const pct = stats.total > 0 ? Math.round((stats.enriched / stats.total) * 100) : 0;
  const missing = stats.total - stats.enriched;

  const filteredStatic     = applyFilters(data.static);
  const filteredCategories = applyFilters(data.categories);
  const filteredGames      = applyFilters(data.games);

  return (
    <div className="space-y-6">

      {/* ── Stats header ── */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900">SEO Manager</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {stats.enriched} / {stats.total} pages enrichies · {pct}% couverture
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleRefresh}
              disabled={refreshing || bulkRunning}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-600 border border-gray-200 hover:border-amber-400 hover:text-amber-700 rounded-xl transition-colors disabled:opacity-50"
            >
              {refreshing ? <Spinner /> : "🔄"} Actualiser
            </button>
            {bulkRunning ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { abortRef.current = true; setBulkRunning(false); }}
                  className="px-3 py-2 text-sm font-semibold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
                >
                  ✕ Arrêter
                </button>
                <div className="text-sm text-gray-600">
                  {bulkProgress.done}/{bulkProgress.total} générées…
                </div>
              </div>
            ) : (
              <button
                onClick={generateAll}
                disabled={missing === 0}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-amber-700 hover:bg-amber-600 text-white rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ✨ Tout générer ({missing} manquantes)
              </button>
            )}
          </div>
        </div>

        {/* Global progress bar */}
        <div className="mt-4">
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div
              className="bg-amber-500 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Bulk progress bar (only during generation) */}
        {bulkRunning && (
          <div className="mt-2">
            <div className="w-full bg-blue-100 rounded-full h-1.5">
              <div
                className="bg-blue-500 h-1.5 rounded-full transition-all"
                style={{ width: bulkProgress.total > 0 ? `${(bulkProgress.done / bulkProgress.total) * 100}%` : "0%" }}
              />
            </div>
          </div>
        )}

        {bulkError && (
          <p className="text-xs text-red-500 mt-2">⚠ {bulkError}</p>
        )}
        {refreshMsg && (
          <p className={`text-xs mt-2 font-medium ${refreshMsg.includes("Erreur") ? "text-red-500" : refreshMsg.includes("aucune") ? "text-gray-500" : "text-emerald-600"}`}>
            ✓ {refreshMsg}
          </p>
        )}
      </div>

      {/* ── Filter bar ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1">
          {(["all", "missing"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
                filter === f
                  ? "bg-amber-600 text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {f === "all" ? "Toutes" : `Non enrichies (${missing})`}
            </button>
          ))}
        </div>

        <input
          type="search"
          placeholder="Rechercher une URL ou un titre…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
        />
      </div>

      {/* ── Stat chips ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Pages statiques",  count: data.static.filter(i => i.record).length,     total: data.static.length,     color: "blue" },
          { label: "Catégories",       count: data.categories.filter(i => i.record).length, total: data.categories.length, color: "purple" },
          { label: "Fiches jeux",      count: data.games.filter(i => i.record).length,      total: data.games.length,      color: "emerald" },
        ].map(({ label, count, total, color }) => (
          <div key={label} className={`bg-white border border-gray-100 rounded-xl p-4 text-center`}>
            <p className={`text-2xl font-black text-${color}-600`}>{count}<span className="text-gray-300 font-normal text-base">/{total}</span></p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Tree sections ── */}
      <SectionBlock
        title="Pages statiques"
        emoji="📄"
        items={filteredStatic}
        generating={generating}
        onGenerate={generate}
        onEdit={(item) => item.record && setEditItem(item as SiteUrlItem & { record: RecordSummary })}
        defaultOpen={true}
      />
      <SectionBlock
        title="Pages catégories"
        emoji="📂"
        items={filteredCategories}
        generating={generating}
        onGenerate={generate}
        onEdit={(item) => item.record && setEditItem(item as SiteUrlItem & { record: RecordSummary })}
        defaultOpen={true}
      />
      <SectionBlock
        title="Fiches jeux"
        emoji="🎲"
        items={filteredGames}
        generating={generating}
        onGenerate={generate}
        onEdit={(item) => item.record && setEditItem(item as SiteUrlItem & { record: RecordSummary })}
        defaultOpen={false}
      />

      {/* ── Edit Modal ── */}
      {editItem && (
        <EditModal
          item={editItem}
          onClose={() => setEditItem(null)}
          onSaved={(record) => {
            updateRecord(editItem.url, record);
            setEditItem(null);
          }}
        />
      )}
    </div>
  );
}
