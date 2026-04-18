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

  if (introWordCount < 180 || introWordCount > 320) {
    throw new Error(`Intro must contain between 180 and 320 words. Received ${introWordCount}.`);
  }

  if (page.sections.length < 3) {
    throw new Error(`Page must contain at least 3 sections. Received ${page.sections.length}.`);
  }

  if (page.faq.length < 3) {
    throw new Error(`Page must contain at least 3 FAQ entries. Received ${page.faq.length}.`);
  }

  if (page.title.length > 60) {
    throw new Error(`Title must be 60 characters or fewer. Received ${page.title.length}.`);
  }

  if (page.meta.length > 155) {
    throw new Error(`Meta must be 155 characters or fewer. Received ${page.meta.length}.`);
  }

  if (page.url !== canonical.url) {
    throw new Error(`Generated URL "${page.url}" does not match canonical URL "${canonical.url}".`);
  }

  return {
    ...page,
    similarPages: page.similarPages.map((item) => ({
      ...item,
      url: ensureUrlLooksLikeInternalPath(item.url, `similarPages:${item.keyword}`),
    })),
    internalLinks: page.internalLinks.map((item, index) =>
      ensureUrlLooksLikeInternalPath(item, `internalLinks[${index}]`),
    ),
  };
}
