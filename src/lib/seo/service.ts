import { getAnthropicClient } from "@/lib/anthropic";
import { buildSeoUrl, resolveSeoRoute } from "./catalog";
import { buildCanonicalSeoInput, normalizeLooseSeoUrl } from "./normalize";
import { buildSeoPrompt } from "./prompt";
import {
  findSeoPageByHash,
  findSeoPageBySlug,
  findSeoPageByUrl,
  upsertSeoPage,
} from "./repository";
import { validateSeoPageBusinessRules } from "./validation";
import {
  CanonicalSeoInput,
  SeoFaqItem,
  SeoGenerationInput,
  SeoPage,
  SeoPageRecord,
  SeoRouteParams,
  SeoSection,
  SeoSimilarPage,
} from "./types";

const DEFAULT_MODEL = process.env.ANTHROPIC_SEO_MODEL ?? "claude-haiku-4-5-20251001";

function extractJsonObject(raw: string): string {
  const trimmed = raw.trim();

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const fenced =
    trimmed.match(/```json\s*([\s\S]*?)\s*```/i) ??
    trimmed.match(/```\s*([\s\S]*?)\s*```/i);

  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  throw new Error("SEO model did not return valid JSON");
}

function toNonEmptyString(value: unknown, fieldName: string): string {
  if (typeof value !== "string") {
    throw new Error(`Invalid field "${fieldName}"`);
  }

  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`Empty field "${fieldName}"`);
  }

  return normalized;
}

function parseSection(value: unknown, index: number): SeoSection {
  if (!value || typeof value !== "object") {
    throw new Error(`Invalid section at index ${index}`);
  }

  const section = value as Record<string, unknown>;

  return {
    h2: toNonEmptyString(section.h2, `sections[${index}].h2`),
    text: toNonEmptyString(section.text, `sections[${index}].text`),
  };
}

function parseFaqItem(value: unknown, index: number): SeoFaqItem {
  if (!value || typeof value !== "object") {
    throw new Error(`Invalid faq item at index ${index}`);
  }

  const faqItem = value as Record<string, unknown>;

  return {
    question: toNonEmptyString(faqItem.question, `faq[${index}].question`),
    answer: toNonEmptyString(faqItem.answer, `faq[${index}].answer`),
  };
}

function parseSimilarPage(value: unknown, index: number): SeoSimilarPage {
  if (!value || typeof value !== "object") {
    throw new Error(`Invalid similar page at index ${index}`);
  }

  const similarPage = value as Record<string, unknown>;

  return {
    keyword: toNonEmptyString(similarPage.keyword, `similarPages[${index}].keyword`),
    url: normalizeLooseSeoUrl(toNonEmptyString(similarPage.url, `similarPages[${index}].url`)),
  };
}

function parseStringList(value: unknown, fieldName: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`Invalid field "${fieldName}"`);
  }

  return value.map((item, index) => toNonEmptyString(item, `${fieldName}[${index}]`));
}

function parseSeoPage(raw: string, canonical: CanonicalSeoInput): SeoPage {
  const json = extractJsonObject(raw);
  const parsed = JSON.parse(json) as Record<string, unknown>;
  const sectionsValue = parsed.sections;
  const faqValue = parsed.faq;
  const similarPagesValue = parsed.similarPages;

  if (!Array.isArray(sectionsValue) || sectionsValue.length < 1) {
    throw new Error('Field "sections" must contain at least 1 item');
  }

  if (!Array.isArray(faqValue) || faqValue.length < 1) {
    throw new Error('Field "faq" must contain at least 1 item');
  }

  if (!Array.isArray(similarPagesValue) || similarPagesValue.length < 1) {
    throw new Error('Field "similarPages" must contain at least 1 item');
  }

  const internalLinks = parseStringList(parsed.internalLinks, "internalLinks");
  if (internalLinks.length < 1) {
    throw new Error('Field "internalLinks" must contain at least 1 item');
  }

  return {
    title: toNonEmptyString(parsed.title, "title"),
    meta: toNonEmptyString(parsed.meta, "meta"),
    url: canonical.url,
    h1: toNonEmptyString(parsed.h1, "h1"),
    intro: toNonEmptyString(parsed.intro, "intro"),
    sections: sectionsValue.slice(0, 6).map(parseSection),
    faq: faqValue.slice(0, 6).map(parseFaqItem),
    similarPages: similarPagesValue.slice(0, 10).map(parseSimilarPage),
    internalLinks: internalLinks.slice(0, 5),
  };
}

async function generateSeoPayload(input: SeoGenerationInput, canonical: CanonicalSeoInput): Promise<SeoPage> {
  const client = getAnthropicClient();
  const prompt = buildSeoPrompt(input);

  const response = await client.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 2500,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: prompt,
            cache_control: { type: "ephemeral" },
          },
        ],
      },
    ],
  });

  const content = response.content.find((item) => item.type === "text");

  if (!content || content.type !== "text") {
    throw new Error("SEO model response was empty");
  }

  const parsed = parseSeoPage(content.text, canonical);
  return validateSeoPageBusinessRules(parsed, canonical);
}

function buildRecord(canonical: CanonicalSeoInput, page: SeoPage, existingStatus?: SeoPageRecord["status"]): SeoPageRecord {
  const now = new Date().toISOString();

  return {
    input_hash: canonical.inputHash,
    slug: canonical.slug,
    payload_json: page,
    status: existingStatus ?? "generated",
    generated_at: now,
    updated_at: now,
  };
}

function createFallbackPage(url: string, params: SeoRouteParams, indexable: boolean): SeoPage {
  const titleParts = [params.genre, params.joueurs, params.duree].filter(Boolean).join(" ");
  const readableTitle = titleParts.replace(/-/g, " ");

  return {
    title: indexable ? `Jeux ${readableTitle}`.trim() : `Selection jeux ${readableTitle}`.trim(),
    meta: indexable
      ? "Une page SEO existe pour cette categorie, mais son contenu detaille n'est pas encore genere."
      : "Cette combinaison est accessible, mais elle n'est pas prioritaire pour l'indexation SEO.",
    url,
    h1: `Jeux ${readableTitle}`.trim(),
    intro: indexable
      ? "Cette page est prete a accueillir un contenu SEO complet. Le gabarit est en place pour afficher une selection pertinente de jeux de societe selon vos criteres, avec une structure claire, des liens internes et une FAQ. Le contenu editorial n'a simplement pas encore ete genere ou publie dans le store SEO. Vous pouvez donc garder cette URL active, la relier a votre navigation ou a votre maillage interne, puis la remplir plus tard avec un texte optimise correspondant a l'intention de recherche cible."
      : "Cette page correspond a une combinaison valide au sens du routing produit, mais elle n'est pas consideree comme prioritaire pour l'indexation SEO. Elle peut tout de meme servir d'exploration a l'utilisateur, via le filtrage ou le maillage interne. Le template reste utile pour maintenir une experience propre, stable et coherente, meme quand le contenu editorial n'a pas encore ete redige ou qu'il n'est pas prevu d'indexer cette combinaison dans les moteurs de recherche."
    ,
    sections: [
      {
        h2: "Pourquoi cette page existe",
        text: "Cette URL est geree par le routeur metier et peut afficher un contenu SEO dedie quand il est disponible dans le store.",
      },
      {
        h2: "Comment elle sera enrichie",
        text: "Le contenu complet peut etre genere, stocke puis re-utilise sans changer le template ou la structure d'URL.",
      },
      {
        h2: "Que faire ensuite",
        text: "Vous pouvez laisser cette page comme fallback propre, ou lancer la generation SEO pour publier un contenu editorialisé.",
      },
    ],
    faq: [
      {
        question: "Pourquoi le contenu detaille n'apparait pas encore ?",
        answer: "Aucun contenu SEO stocke n'a encore ete publie pour cette URL.",
      },
      {
        question: "La page peut-elle quand meme rester accessible ?",
        answer: "Oui, elle peut servir de page produit ou de navigation meme sans contenu SEO complet.",
      },
      {
        question: "Peut-on la remplir plus tard ?",
        answer: "Oui, le template reutilise automatiquement le contenu stocke des qu'il existe.",
      },
    ],
    similarPages: [],
    internalLinks: ["/jeux", url],
  };
}

export async function getOrCreateSeoPage(input: SeoGenerationInput): Promise<SeoPageRecord> {
  const canonical = buildCanonicalSeoInput(input);
  const existing = await findSeoPageByHash(canonical.inputHash);

  if (existing) {
    return existing;
  }

  const page = await generateSeoPayload(input, canonical);
  const record = buildRecord(canonical, page);
  return upsertSeoPage(record);
}

export async function getSeoPageBySlug(slug: string): Promise<SeoPageRecord | null> {
  return findSeoPageBySlug(slug);
}

export async function getSeoPageByUrl(url: string): Promise<SeoPageRecord | null> {
  return findSeoPageByUrl(url);
}

export async function resolveSeoPageContent(params: SeoRouteParams): Promise<{
  route: ReturnType<typeof resolveSeoRoute>;
  record: SeoPageRecord | null;
  page: SeoPage | null;
  fallback: boolean;
}> {
  const route = resolveSeoRoute(params);

  if (!route.valid) {
    return {
      route,
      record: null,
      page: null,
      fallback: false,
    };
  }

  const url = buildSeoUrl(params);
  const record = await getSeoPageByUrl(url);

  if (record) {
    return {
      route,
      record,
      page: record.payload_json,
      fallback: false,
    };
  }

  return {
    route,
    record: null,
    page: createFallbackPage(url, params, route.indexable),
    fallback: true,
  };
}
