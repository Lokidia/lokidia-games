import { NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase/service";

type SearchRow = {
  slug: string;
  nom: string;
  note: number;
  image_url: string | null;
  complexite: string | null;
  description: string | null;
  joueurs_min: number | null;
  joueurs_max: number | null;
  duree_min: number | null;
  duree_max: number | null;
  age_min: number | null;
  mecaniques: string[] | null;
  jeux_categories: {
    categories: { nom: string; slug: string } | null;
  }[] | null;
};

type SearchResult = Pick<SearchRow, "slug" | "nom" | "note" | "image_url" | "complexite" | "description"> & {
  match_label: string | null;
  match_type: "nom" | "categorie" | "mecanique" | "profil" | "description" | null;
  categories: string[];
};

type ScoredSearchResult = SearchResult & { score: number };

const SEARCH_SELECT = `
  slug, nom, note, image_url, complexite, description,
  joueurs_min, joueurs_max, duree_min, duree_max, age_min, mecaniques,
  jeux_categories(categories(nom, slug))
`;

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .trim();
}

function includes(haystack: string | null | undefined, needle: string): boolean {
  return Boolean(haystack && normalize(haystack).includes(needle));
}

function playerIntent(row: SearchRow, q: string): string | null {
  const min = row.joueurs_min ?? 0;
  const max = row.joueurs_max ?? 0;
  const twoPlayers = /\b(2|deux|duo|couple)\b/.test(q);
  const solo = /\b(solo|1 joueur|seul)\b/.test(q);
  const many = /\b(5\+|5 joueurs|6 joueurs|amis|groupe|grande tablee)\b/.test(q);

  if (solo && min <= 1 && max >= 1) return "solo";
  if (twoPlayers && min <= 2 && max >= 2) return "2 joueurs";
  if (many && max >= 5) return "5+ joueurs";
  return null;
}

function durationIntent(row: SearchRow, q: string): string | null {
  const min = row.duree_min ?? 0;
  const max = row.duree_max ?? 0;
  const quick = /\b(rapide|court|apero|apero|15 min|20 min|30 min|moins de 30)\b/.test(q);
  const medium = /\b(45 min|60 min|1h|une heure)\b/.test(q);
  const long = /\b(long|2h|3h|marathon)\b/.test(q);

  if (quick && min <= 30) return "partie rapide";
  if (medium && max >= 30 && min <= 75) return "30-60 min";
  if (long && max >= 120) return "longue partie";
  return null;
}

function scoreRow(row: SearchRow, rawQuery: string): SearchResult & { score: number } | null {
  const q = normalize(rawQuery);
  const categories = (row.jeux_categories ?? [])
    .map((item) => item.categories?.nom)
    .filter((nom): nom is string => Boolean(nom));

  let score = 0;
  let matchLabel: string | null = null;
  let matchType: SearchResult["match_type"] = null;

  const nom = normalize(row.nom);
  if (nom === q) {
    score += 120;
    matchLabel = "Titre exact";
    matchType = "nom";
  } else if (nom.startsWith(q)) {
    score += 90;
    matchLabel = "Titre";
    matchType = "nom";
  } else if (nom.includes(q)) {
    score += 70;
    matchLabel = "Titre";
    matchType = "nom";
  }

  const categoryMatch = categories.find((cat) => includes(cat, q));
  if (categoryMatch) {
    score += 55;
    matchLabel ??= categoryMatch;
    matchType ??= "categorie";
  }

  const mecaniqueMatch = (row.mecaniques ?? []).find((meca) => includes(meca, q));
  if (mecaniqueMatch) {
    score += 45;
    matchLabel ??= mecaniqueMatch;
    matchType ??= "mecanique";
  }

  if (includes(row.complexite, q)) {
    score += 35;
    matchLabel ??= row.complexite;
    matchType ??= "profil";
  }

  const player = playerIntent(row, q);
  if (player) {
    score += 38;
    matchLabel ??= player;
    matchType ??= "profil";
  }

  const duration = durationIntent(row, q);
  if (duration) {
    score += 34;
    matchLabel ??= duration;
    matchType ??= "profil";
  }

  if (includes(row.description, q)) {
    score += 15;
    matchLabel ??= "Description";
    matchType ??= "description";
  }

  if (score === 0) return null;

  return {
    slug: row.slug,
    nom: row.nom,
    note: row.note,
    image_url: row.image_url,
    complexite: row.complexite,
    description: row.description,
    categories,
    match_label: matchLabel,
    match_type: matchType,
    score: score + (row.note ?? 0),
  };
}

function withoutScore(result: ScoredSearchResult): SearchResult {
  return {
    slug: result.slug,
    nom: result.nom,
    note: result.note,
    image_url: result.image_url,
    complexite: result.complexite,
    description: result.description,
    categories: result.categories,
    match_label: result.match_label,
    match_type: result.match_type,
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) return NextResponse.json([]);

  const sb = createServiceClient();
  const { data, error } = await sb
    .from("jeux")
    .select(SEARCH_SELECT)
    .eq("actif", true)
    .order("note", { ascending: false })
    .limit(120);

  if (error) return NextResponse.json([], { status: 500 });

  const results = ((data ?? []) as unknown as SearchRow[])
    .map((row) => scoreRow(row, q))
    .filter((row): row is ScoredSearchResult => row !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(withoutScore);

  return NextResponse.json(results);
}
