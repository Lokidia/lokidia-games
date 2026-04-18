import { SeoGenerationInput } from "./types";

export interface SeoTargetCombination {
  label: string;
  input: SeoGenerationInput;
}

export const SEO_TARGET_COMBINATIONS: SeoTargetCombination[] = [
  // ── Niveau 1 : genre seul (4) ───────────────────────────────────
  { label: "Stratégie",   input: { genre: "Stratégie" } },
  { label: "Familial",    input: { genre: "Familial" } },
  { label: "Coopératif",  input: { genre: "Coopératif" } },
  { label: "Ambiance",    input: { genre: "Ambiance" } },

  // ── Niveau 2 : genre + joueurs (9) ──────────────────────────────
  { label: "Stratégie / À 2",   input: { genre: "Stratégie",  joueurs: "a-2" } },
  { label: "Stratégie / À 3",   input: { genre: "Stratégie",  joueurs: "a-3" } },
  { label: "Familial / À 2",    input: { genre: "Familial",   joueurs: "a-2" } },
  { label: "Familial / À 4",    input: { genre: "Familial",   joueurs: "a-4" } },
  { label: "Familial / 5+",     input: { genre: "Familial",   joueurs: "a-5-plus" } },
  { label: "Coopératif / À 2",  input: { genre: "Coopératif", joueurs: "a-2" } },
  { label: "Coopératif / À 3",  input: { genre: "Coopératif", joueurs: "a-3" } },
  { label: "Coopératif / Solo", input: { genre: "Coopératif", joueurs: "solo" } },
  { label: "Ambiance / 5+",     input: { genre: "Ambiance",   joueurs: "a-5-plus" } },

  // ── Niveau 3 : genre + joueurs + durée (7) ──────────────────────
  { label: "Stratégie / À 2 / 60min+",       input: { genre: "Stratégie",  joueurs: "a-2",       duree: "60-min-plus" } },
  { label: "Familial / À 2 / <30min",        input: { genre: "Familial",   joueurs: "a-2",       duree: "moins-de-30-min" } },
  { label: "Familial / À 2 / 30-60min",      input: { genre: "Familial",   joueurs: "a-2",       duree: "30-60-min" } },
  { label: "Familial / À 4 / 30-60min",      input: { genre: "Familial",   joueurs: "a-4",       duree: "30-60-min" } },
  { label: "Coopératif / À 2 / 30-60min",    input: { genre: "Coopératif", joueurs: "a-2",       duree: "30-60-min" } },
  { label: "Coopératif / Solo / 30-60min",   input: { genre: "Coopératif", joueurs: "solo",      duree: "30-60-min" } },
  { label: "Ambiance / 5+ / <30min",         input: { genre: "Ambiance",   joueurs: "a-5-plus",  duree: "moins-de-30-min" } },
];
