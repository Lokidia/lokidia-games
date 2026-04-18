import { CanonicalSeoInput, SeoPage } from "./types";
import { normalizeLooseSeoUrl } from "./normalize";

function countWords(value: string): number {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function ensureUrlLooksLikeInternalPath(url: string, fieldName: string): string {
  const normalized = normalizeLooseSeoUrl(url);

  if (!normalized.startsWith("/")) {
    throw new Error(`Invalid URL in "${fieldName}"`);
  }

  return normalized;
}

export function validateSeoPageBusinessRules(
  page: SeoPage,
  canonical: CanonicalSeoInput,
): SeoPage {
  const introWordCount = countWords(page.intro);

  // Require a non-trivial intro but don't be too strict — Claude models vary in verbosity.
  if (introWordCount < 30) {
    throw new Error(`Intro too short: ${introWordCount} words (minimum 30).`);
  }

  // Require at least 1 section and 1 FAQ — parseSeoPage already enforces ≥ 1.
  // We don't re-throw here; slicing was already done upstream.

  // Truncate title and meta instead of throwing so minor overruns don't fail the whole page.
  const title = page.title.slice(0, 60);
  const meta  = page.meta.slice(0, 155);

  return {
    ...page,
    title,
    meta,
    similarPages: page.similarPages.map((item) => ({
      ...item,
      url: ensureUrlLooksLikeInternalPath(item.url, `similarPages:${item.keyword}`),
    })),
    internalLinks: page.internalLinks.map((item, index) =>
      ensureUrlLooksLikeInternalPath(item, `internalLinks[${index}]`),
    ),
  };
}
