import { createHash } from "node:crypto";
import { buildSeoUrl } from "./catalog";
import { CanonicalSeoInput, NormalizedSeoInput, SeoGenerationInput } from "./types";

function stripDiacritics(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function singularizeToken(token: string): string {
  if (token.length <= 3) {
    return token;
  }

  if (token.endsWith("ies") && token.length > 4) {
    return `${token.slice(0, -3)}y`;
  }

  if (token.endsWith("sses") || token.endsWith("us") || token.endsWith("is")) {
    return token;
  }

  if (token.endsWith("x") && token.length > 4) {
    return token.slice(0, -1);
  }

  if (token.endsWith("s") && token.length > 4) {
    return token.slice(0, -1);
  }

  return token;
}

function normalizeTokenStream(value: string): string {
  return stripDiacritics(value)
    .toLowerCase()
    .replace(/[’']/g, " ")
    .replace(/&/g, " et ")
    .replace(/\+/g, " plus ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map(singularizeToken)
    .join(" ");
}

function slugify(value: string): string {
  return normalizeTokenStream(value)
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function ensureNonEmpty(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Missing or invalid field "${fieldName}"`);
  }

  return value.trim();
}

function normalizeOptional(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) {
    return "";
  }

  return normalizeTokenStream(value.trim());
}

export function normalizeSeoInput(input: SeoGenerationInput): NormalizedSeoInput {
  return {
    genre: normalizeTokenStream(ensureNonEmpty(input.genre, "genre")),
    joueurs: normalizeOptional(input.joueurs),
    duree: normalizeOptional(input.duree),
    niveau: normalizeOptional(input.niveau),
    cible: normalizeOptional(input.cible),
  };
}

export function buildCanonicalSeoInput(input: SeoGenerationInput): CanonicalSeoInput {
  const normalized = normalizeSeoInput(input);

  const url = buildSeoUrl({
    genre: slugify(normalized.genre),
    joueurs: normalized.joueurs ? slugify(normalized.joueurs) : undefined,
    duree: normalized.duree ? slugify(normalized.duree) : undefined,
  });
  const slug = url.replace(/^\/jeux\//, "").replace(/\//g, "--") || "jeux";
  const inputHash = createHash("sha256")
    .update(JSON.stringify(normalized))
    .digest("hex");

  return {
    normalized,
    slug,
    inputHash,
    url,
  };
}

export function normalizeLooseSeoUrl(url: string): string {
  const value = url.trim();

  if (!value) {
    return "";
  }

  const withoutOrigin = value.replace(/^https?:\/\/[^/]+/i, "");
  const withBase = withoutOrigin.startsWith("/")
    ? withoutOrigin
    : `/${withoutOrigin}`;

  return withBase
    .split("/")
    .filter(Boolean)
    .map(slugify)
    .filter(Boolean)
    .join("/")
    .replace(/^/, "/");
}
