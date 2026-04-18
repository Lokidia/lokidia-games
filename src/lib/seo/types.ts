export interface SeoGenerationInput {
  genre: string;
  joueurs?: string;
  duree?: string;
  niveau?: string;
  cible?: string;
}

export interface NormalizedSeoInput {
  genre: string;
  joueurs: string;
  duree: string;
  niveau: string;
  cible: string;
}

export interface CanonicalSeoInput {
  normalized: NormalizedSeoInput;
  slug: string;
  inputHash: string;
  url: string;
}

export interface SeoSection {
  h2: string;
  text: string;
}

export interface SeoFaqItem {
  question: string;
  answer: string;
}

export interface SeoSimilarPage {
  keyword: string;
  url: string;
}

export interface SeoPage {
  title: string;
  meta: string;
  url: string;
  h1: string;
  intro: string;
  sections: SeoSection[];
  faq: SeoFaqItem[];
  similarPages: SeoSimilarPage[];
  internalLinks: string[];
}

export type SeoPageStatus = "generated" | "published" | "draft" | "archived";

export interface SeoPageRecord {
  input_hash: string;
  slug: string;
  payload_json: SeoPage;
  status: SeoPageStatus;
  generated_at: string;
  updated_at: string;
}

export interface SeoCatalogItem {
  label: string;
  slug: string;
}

export interface SeoPillar extends SeoCatalogItem {
  type: "genre" | "players";
  index: boolean;
  menu: boolean;
}

export interface SeoRouteParams {
  genre?: string;
  joueurs?: string;
  duree?: string;
}

export interface SeoRouteResolution {
  url: string;
  valid: boolean;
  indexable: boolean;
  robots: "index,follow" | "noindex,follow";
  level: 1 | 2 | 3;
}
