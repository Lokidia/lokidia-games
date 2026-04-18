"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { SeoGenerationInput, SeoPage, SeoPageStatus } from "@/lib/seo/types";

const SeoEditModal = dynamic(() => import("@/app/admin/seo/_components/SeoEditModal"), { ssr: false });

export interface TargetItem {
  label: string;
  url: string;
  slug: string | null;
  input: SeoGenerationInput;
  payload_json: SeoPage | null;
  generated: boolean;
  status: SeoPageStatus | null;
  generatedAt: string | null;
}

interface ExtraPage {
  slug: string;
  url: string;
  status: SeoPageStatus;
  generatedAt: string;
}

interface Props {
  targets: TargetItem[];
  extraPages: ExtraPage[];
}

interface EditState {
  item: TargetItem;
  data: SeoPage;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: SeoPageStatus | null }) {
  if (!status) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
        Non généré
      </span>
    );
  }
  const styles: Record<SeoPageStatus, string> = {
    generated: "bg-emerald-100 text-emerald-700",
    published:  "bg-blue-100 text-blue-700",
    draft:      "bg-amber-100 text-amber-700",
    archived:   "bg-red-100 text-red-600",
  };
  const labels: Record<SeoPageStatus, string> = {
    generated: "Généré",
    published:  "Publié",
    draft:      "Brouillon",
    archived:   "Archivé",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export default function AdminDashboard({ targets, extraPages }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [loadingKeys, setLoadingKeys] = useState<Set<string>>(new Set());
  const [errorKeys,   setErrorKeys]   = useState<Map<string, string>>(new Map());
  const [freshKeys,   setFreshKeys]   = useState<Set<string>>(new Set());
  const [editState,   setEditState]   = useState<EditState | null>(null);
  const [loadingEdit, setLoadingEdit] = useState<string | null>(null);

  const generated = targets.filter((t) => t.generated || freshKeys.has(t.url)).length;
  const total     = targets.length;
  const pct       = Math.round((generated / total) * 100);
  const estimatedTokens = (generated + extraPages.length) * 4300;

  async function handleGenerate(item: TargetItem) {
    const key = item.url;
    setLoadingKeys((prev) => new Set(prev).add(key));
    setErrorKeys((prev) => { const m = new Map(prev); m.delete(key); return m; });

    try {
      const res = await fetch("/api/seo/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.input),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Erreur inconnue" }));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }

      setFreshKeys((prev) => new Set(prev).add(key));
      startTransition(() => router.refresh());
    } catch (err) {
      setErrorKeys((prev) => new Map(prev).set(key, err instanceof Error ? err.message : String(err)));
    } finally {
      setLoadingKeys((prev) => { const s = new Set(prev); s.delete(key); return s; });
    }
  }

  async function handleGenerateAll() {
    const missing = targets.filter((t) => !t.generated && !freshKeys.has(t.url));
    for (const item of missing) {
      await handleGenerate(item);
    }
  }

  async function handleEdit(item: TargetItem) {
    if (!item.slug) return;

    // If we already have payload in props, open immediately
    if (item.payload_json) {
      setEditState({ item, data: item.payload_json });
      return;
    }

    // Otherwise fetch from API
    setLoadingEdit(item.url);
    try {
      const res = await fetch(`/api/seo/update?slug=${encodeURIComponent(item.slug)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const record = await res.json();
      setEditState({ item, data: record.payload_json });
    } catch (err) {
      setErrorKeys((prev) => new Map(prev).set(item.url, err instanceof Error ? err.message : String(err)));
    } finally {
      setLoadingEdit(null);
    }
  }

  function handleEditSaved() {
    setEditState(null);
    startTransition(() => router.refresh());
  }

  const pendingCount = targets.filter((t) => !t.generated && !freshKeys.has(t.url)).length;

  return (
    <>
      <div className="space-y-8">

        {/* ── En-tête ── */}
        <div>
          <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">Administration</p>
          <h1 className="text-3xl font-black text-amber-950">Dashboard SEO</h1>
        </div>

        {/* ── Cartes stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Pages générées",   value: generated,                                       color: "text-emerald-600" },
            { label: "Cibles totales",    value: total,                                            color: "text-amber-900" },
            { label: "Avancement",        value: `${pct} %`,                                       color: pct === 100 ? "text-emerald-600" : "text-amber-600" },
            { label: "Tokens économisés", value: `~${(estimatedTokens).toLocaleString("fr-FR")}`, color: "text-blue-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-amber-100 p-5 shadow-sm">
              <p className={`text-2xl font-black ${color}`}>{value}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Barre de progression ── */}
        <div className="bg-white rounded-2xl border border-amber-100 p-5 shadow-sm">
          <div className="flex justify-between text-sm font-semibold text-amber-900 mb-2">
            <span>Progression du catalogue SEO</span>
            <span>{generated} / {total}</span>
          </div>
          <div className="w-full bg-amber-100 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Chaque page en cache économise ~4 300 tokens Anthropic à chaque rechargement (0 appel API).
          </p>
        </div>

        {/* ── Table des 20 cibles ── */}
        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-amber-100">
            <h2 className="text-lg font-bold text-amber-950">Combinaisons cibles ({total})</h2>
            {pendingCount > 0 && (
              <button
                onClick={handleGenerateAll}
                disabled={loadingKeys.size > 0}
                className="text-sm font-semibold px-4 py-1.5 rounded-lg bg-amber-700 text-white hover:bg-amber-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loadingKeys.size > 0 ? "Génération en cours…" : `Tout générer (${pendingCount})`}
              </button>
            )}
          </div>

          <div className="divide-y divide-amber-50">
            {targets.map((item) => {
              const key       = item.url;
              const isLoading = loadingKeys.has(key);
              const isDone    = item.generated || freshKeys.has(key);
              const error     = errorKeys.get(key);
              const isEditLoading = loadingEdit === key;

              return (
                <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-3 px-6 py-4 hover:bg-amber-50/50 transition-colors">
                  {/* Label + URL */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-amber-900 text-sm truncate">{item.label}</p>
                    <Link
                      href={item.url}
                      target="_blank"
                      className="text-xs text-amber-600 hover:underline truncate block"
                    >
                      {item.url}
                    </Link>
                    {error && (
                      <p className="text-xs text-red-500 mt-0.5 line-clamp-2" title={error}>⚠ {error}</p>
                    )}
                  </div>

                  {/* Date */}
                  <div className="shrink-0 text-xs text-gray-400 w-36 text-right hidden sm:block">
                    {item.generatedAt ? formatDate(item.generatedAt) : "—"}
                  </div>

                  {/* Status */}
                  <div className="shrink-0 w-24">
                    <StatusBadge status={freshKeys.has(key) ? "generated" : item.status} />
                  </div>

                  {/* Actions */}
                  <div className="shrink-0 flex items-center gap-2 justify-end w-36">
                    {/* Edit button — only when generated */}
                    {isDone && item.slug && (
                      <button
                        onClick={() => handleEdit(item)}
                        disabled={isEditLoading}
                        className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50 disabled:opacity-50 transition-colors"
                      >
                        {isEditLoading ? "…" : "Éditer"}
                      </button>
                    )}

                    {/* Generate / Regenerate */}
                    {isDone ? (
                      <button
                        onClick={() => handleGenerate(item)}
                        disabled={isLoading}
                        className="text-xs text-gray-400 hover:text-amber-700 transition-colors disabled:opacity-50"
                      >
                        {isLoading ? "…" : "Régénérer"}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleGenerate(item)}
                        disabled={isLoading}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isLoading ? (
                          <span className="flex items-center gap-1.5">
                            <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                            Génération…
                          </span>
                        ) : "Générer"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Pages hors cibles ── */}
        {extraPages.length > 0 && (
          <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-amber-100">
              <h2 className="text-lg font-bold text-amber-950">Pages supplémentaires ({extraPages.length})</h2>
              <p className="text-xs text-gray-400 mt-0.5">Générées via l'API mais hors des 20 combinaisons cibles.</p>
            </div>
            <div className="divide-y divide-amber-50">
              {extraPages.map((p) => (
                <div key={p.slug} className="flex flex-col sm:flex-row sm:items-center gap-3 px-6 py-4 hover:bg-amber-50/50">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-gray-500 truncate">{p.slug}</p>
                    <Link href={p.url} target="_blank" className="text-xs text-amber-600 hover:underline truncate block">
                      {p.url}
                    </Link>
                  </div>
                  <div className="text-xs text-gray-400 hidden sm:block">{formatDate(p.generatedAt)}</div>
                  <StatusBadge status={p.status} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Modal édition ── */}
      {editState && (
        <SeoEditModal
          slug={editState.item.slug!}
          label={editState.item.label}
          initialData={editState.data}
          onClose={() => setEditState(null)}
          onSaved={handleEditSaved}
        />
      )}
    </>
  );
}
