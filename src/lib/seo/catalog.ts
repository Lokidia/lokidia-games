import {
  SeoCatalogItem,
  SeoPillar,
  SeoRouteParams,
  SeoRouteResolution,
} from "./types";

const PILLARS: SeoPillar[] = [
  { label: "Strategie", slug: "strategie", type: "genre", index: true, menu: true },
  { label: "Cooperatif", slug: "cooperatif", type: "genre", index: true, menu: true },
  { label: "Familial", slug: "familial", type: "genre", index: true, menu: true },
  { label: "Ambiance", slug: "ambiance", type: "genre", index: true, menu: true },
  { label: "Cartes", slug: "cartes", type: "genre", index: true, menu: true },
  { label: "Solo", slug: "solo", type: "players", index: true, menu: true },
  { label: "A 2", slug: "a-2", type: "players", index: true, menu: true },
  { label: "A 5+", slug: "a-5-plus", type: "players", index: true, menu: true },
];

const ALLOWED_PLAYERS: SeoCatalogItem[] = [
  { label: "Solo", slug: "solo" },
  { label: "A 2", slug: "a-2" },
  { label: "A 3", slug: "a-3" },
  { label: "A 4", slug: "a-4" },
  { label: "A 5+", slug: "a-5-plus" },
];

const ALLOWED_DURATIONS: SeoCatalogItem[] = [
  { label: "Moins de 30 min", slug: "moins-de-30-min" },
  { label: "30 a 60 min", slug: "30-60-min" },
  { label: "60 min et plus", slug: "60-min-plus" },
];

const ALLOWED_GENRES: SeoCatalogItem[] = [
  { label: "Strategie", slug: "strategie" },
  { label: "Cooperatif", slug: "cooperatif" },
  { label: "Familial", slug: "familial" },
  { label: "Ambiance", slug: "ambiance" },
  { label: "Cartes", slug: "cartes" },
  { label: "Des", slug: "des" },
];

const ALLOWED_GENRE_PLAYERS = new Set([
  "strategie|a-2",
  "strategie|solo",
  "cooperatif|a-2",
  "cooperatif|solo",
  "familial|a-2",
  "familial|a-4",
  "ambiance|a-5-plus",
  "cartes|a-2",
  "cartes|solo",
]);

const ALLOWED_GENRE_PLAYERS_DURATION = new Set([
  "strategie|a-2|60-min-plus",
  "cooperatif|a-2|30-60-min",
  "cooperatif|solo|30-60-min",
  "familial|a-2|moins-de-30-min",
  "familial|a-4|30-60-min",
  "ambiance|a-5-plus|moins-de-30-min",
  "cartes|a-2|moins-de-30-min",
]);

const INDEXATION_RULES = {
  default: "noindex,follow" as const,
  pillarPages: "index,follow" as const,
  allowedGenrePlayers: "index,follow" as const,
  allowedGenrePlayersDuration: "index,follow" as const,
  disallowDurationOnly: true,
  disallowLevelOnly: true,
  disallowUnknownCombinations: true,
  minResultsToIndex: 6,
};

const URL_PATTERN = {
  level1: "/jeux/[slug]",
  level2: "/jeux/[genre]/[joueurs]",
  level3: "/jeux/[genre]/[joueurs]/[duree]",
};

export const SEO_CATALOG_CONFIG = {
  pillars: PILLARS,
  allowedPlayers: ALLOWED_PLAYERS,
  allowedDurations: ALLOWED_DURATIONS,
  allowedGenres: ALLOWED_GENRES,
  allowedCombinations: {
    genrePlayers: [
      ["strategie", "a-2"],
      ["strategie", "solo"],
      ["cooperatif", "a-2"],
      ["cooperatif", "solo"],
      ["familial", "a-2"],
      ["familial", "a-4"],
      ["ambiance", "a-5-plus"],
      ["cartes", "a-2"],
      ["cartes", "solo"],
    ],
    genrePlayersDuration: [
      ["strategie", "a-2", "60-min-plus"],
      ["cooperatif", "a-2", "30-60-min"],
      ["cooperatif", "solo", "30-60-min"],
      ["familial", "a-2", "moins-de-30-min"],
      ["familial", "a-4", "30-60-min"],
      ["ambiance", "a-5-plus", "moins-de-30-min"],
      ["cartes", "a-2", "moins-de-30-min"],
    ],
  },
  indexationRules: INDEXATION_RULES,
  urlPattern: URL_PATTERN,
} as const;

function isKnownGenre(slug?: string): slug is string {
  return Boolean(slug && ALLOWED_GENRES.some((item) => item.slug === slug));
}

function isKnownPlayer(slug?: string): slug is string {
  return Boolean(slug && ALLOWED_PLAYERS.some((item) => item.slug === slug));
}

function isKnownDuration(slug?: string): slug is string {
  return Boolean(slug && ALLOWED_DURATIONS.some((item) => item.slug === slug));
}

function isPillarSlug(slug?: string): boolean {
  return Boolean(slug && PILLARS.some((item) => item.slug === slug));
}

function isValidLevelOne(genre?: string): boolean {
  return isPillarSlug(genre);
}

function isValidLevelTwo(genre?: string, joueurs?: string): boolean {
  return isKnownGenre(genre) && isKnownPlayer(joueurs);
}

function isValidLevelThree(genre?: string, joueurs?: string, duree?: string): boolean {
  return isKnownGenre(genre) && isKnownPlayer(joueurs) && isKnownDuration(duree);
}

export function buildSeoUrl(params: SeoRouteParams): string {
  const segments = [params.genre, params.joueurs, params.duree].filter(Boolean);
  return `/jeux/${segments.join("/")}`;
}

export function isIndexablePage(params: SeoRouteParams): boolean {
  const { genre, joueurs, duree } = params;

  if (genre && !joueurs && !duree) {
    return isPillarSlug(genre);
  }

  if (genre && joueurs && !duree) {
    return isKnownGenre(genre) && isKnownPlayer(joueurs) && ALLOWED_GENRE_PLAYERS.has(`${genre}|${joueurs}`);
  }

  if (genre && joueurs && duree) {
    return (
      isKnownGenre(genre) &&
      isKnownPlayer(joueurs) &&
      isKnownDuration(duree) &&
      ALLOWED_GENRE_PLAYERS_DURATION.has(`${genre}|${joueurs}|${duree}`)
    );
  }

  return false;
}

export function resolveSeoRoute(params: SeoRouteParams): SeoRouteResolution {
  const level = params.duree ? 3 : params.joueurs ? 2 : 1;
  const indexable = isIndexablePage(params);
  const valid =
    level === 1
      ? isValidLevelOne(params.genre)
      : level === 2
        ? isValidLevelTwo(params.genre, params.joueurs)
        : isValidLevelThree(params.genre, params.joueurs, params.duree);

  return {
    url: buildSeoUrl(params),
    valid,
    indexable,
    robots: valid && indexable ? "index,follow" : "noindex,follow",
    level,
  };
}
