"use client";

import { useState } from "react";
import type { SeoPage } from "@/lib/seo/types";

interface Props {
  slug: string;
  label: string;
  initialData: SeoPage;
  onClose: () => void;
  onSaved: () => void;
}

export default function SeoEditModal({ slug, label, initialData, onClose, onSaved }: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Flat editable state
  const [title,    setTitle]    = useState(initialData.title);
  const [meta,     setMeta]     = useState(initialData.meta);
  const [h1,       setH1]       = useState(initialData.h1);
  const [intro,    setIntro]    = useState(initialData.intro);
  const [sections, setSections] = useState(
    initialData.sections.map((s) => ({ h2: s.h2, text: s.text })),
  );
  const [faq, setFaq] = useState(
    initialData.faq.map((f) => ({ question: f.question, answer: f.answer })),
  );

  function updateSection(i: number, field: "h2" | "text", value: string) {
    setSections((prev) => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  }

  function updateFaq(i: number, field: "question" | "answer", value: string) {
    setFaq((prev) => prev.map((f, idx) => idx === i ? { ...f, [field]: value } : f));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const payload: Partial<SeoPage> = { title, meta, h1, intro, sections, faq };
      const res = await fetch("/api/seo/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, payload }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Erreur inconnue" }));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-8 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-amber-100 w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-100">
          <div>
            <p className="text-xs font-bold text-amber-600 uppercase tracking-widest">Éditer SEO</p>
            <h2 className="text-lg font-bold text-amber-950">{label}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            aria-label="Fermer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">

          {/* Title */}
          <Field label="Title" hint={`${title.length}/60`} hintColor={title.length > 60 ? "text-red-500" : "text-gray-400"}>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
            />
          </Field>

          {/* Meta */}
          <Field label="Meta description" hint={`${meta.length}/155`} hintColor={meta.length > 155 ? "text-red-500" : "text-gray-400"}>
            <textarea
              className="input resize-none"
              rows={2}
              value={meta}
              onChange={(e) => setMeta(e.target.value)}
              maxLength={200}
            />
          </Field>

          {/* H1 */}
          <Field label="H1">
            <input
              className="input"
              value={h1}
              onChange={(e) => setH1(e.target.value)}
            />
          </Field>

          {/* Intro */}
          <Field label="Introduction" hint={`${intro.split(/\s+/).filter(Boolean).length} mots`} hintColor="text-gray-400">
            <textarea
              className="input resize-none"
              rows={5}
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
            />
          </Field>

          {/* Sections H2 */}
          <div>
            <p className="label mb-3">Sections H2</p>
            <div className="space-y-4">
              {sections.map((s, i) => (
                <div key={i} className="bg-amber-50 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-bold text-amber-700">Section {i + 1}</p>
                  <input
                    className="input"
                    placeholder="Titre H2"
                    value={s.h2}
                    onChange={(e) => updateSection(i, "h2", e.target.value)}
                  />
                  <textarea
                    className="input resize-none"
                    rows={3}
                    placeholder="Contenu"
                    value={s.text}
                    onChange={(e) => updateSection(i, "text", e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div>
            <p className="label mb-3">FAQ</p>
            <div className="space-y-4">
              {faq.map((f, i) => (
                <div key={i} className="bg-blue-50 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-bold text-blue-700">Question {i + 1}</p>
                  <input
                    className="input"
                    placeholder="Question"
                    value={f.question}
                    onChange={(e) => updateFaq(i, "question", e.target.value)}
                  />
                  <textarea
                    className="input resize-none"
                    rows={2}
                    placeholder="Réponse"
                    value={f.answer}
                    onChange={(e) => updateFaq(i, "answer", e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-amber-100 flex items-center justify-between gap-3">
          {error && <p className="text-xs text-red-500 flex-1 truncate" title={error}>⚠ {error}</p>}
          {!error && <span />}
          <div className="flex gap-2 shrink-0">
            <button onClick={onClose} className="btn-secondary text-sm">Annuler</button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  hintColor = "text-gray-400",
  children,
}: {
  label: string;
  hint?: string;
  hintColor?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <p className="label">{label}</p>
        {hint && <span className={`text-xs ${hintColor}`}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}
