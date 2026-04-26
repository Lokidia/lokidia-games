import { NextRequest, NextResponse } from "next/server";

export interface ApifyProduct {
  asin: string;
  nom: string;
  prix: string | null;
  image: string | null;
  url: string;
  source: "amazon" | "asmodee";
  score: number;
  scoreLabel: "excellent" | "bon" | "moyen";
  raisons: string[];
  alertes: string[];
  normalizedName: string;
  rating: number | null;
  reviewsCount: number | null;
}

const ACTOR_ID = "junglee~Amazon-crawler";
const APIFY_TOKEN = process.env.APIFY_API_TOKEN ?? "";
const AFFILIATE_TAG = "lokidia21-21";

const REQUIRED_SCORE = 35;

const BOARD_GAME_TERMS = [
  "jeu de societe",
  "jeu de plateau",
  "jeu de cartes",
  "board game",
  "card game",
  "asmodee",
  "iello",
  "gigamic",
  "libellud",
  "space cowboys",
  "days of wonder",
  "repos production",
  "ravensburger",
  "hasbro gaming",
  "kosmos",
  "z-man games",
];

const STRONG_EXCLUDED_TERMS = [
  "sleeve",
  "sleeves",
  "protege carte",
  "protege-cartes",
  "protection carte",
  "deck box",
  "rangement",
  "insert",
  "organizer",
  "organiseur",
  "tapis",
  "playmat",
  "figurine",
  "miniature",
  "puzzle",
  "peluche",
  "lego",
  "livre",
  "cahier",
  "coloriage",
  "poster",
  "boite vide",
  "recharge",
  "booster",
  "lot de",
];

const SOFT_WARNING_TERMS = [
  "extension",
  "expansion",
  "scenario",
  "scenario",
  "pack",
  "extension de jeu",
];

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .replace(/[^a-z0-9+ ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanTitle(raw: string): string {
  return raw
    .replace(/\s*[-–|]\s*Amazon.*$/i, "")
    .replace(/\b(version française|version francaise|vf|français|francais)\b/gi, "")
    .replace(/\b(jeu de société|jeu de societe|board game)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parsePrice(raw: unknown): string | null {
  if (!raw) return null;
  if (typeof raw === "string") return raw;
  if (typeof raw === "number") return `${raw.toFixed(2)} €`;
  if (typeof raw === "object" && raw !== null) {
    const o = raw as Record<string, unknown>;
    const v = o.value ?? o.amount ?? o.price;
    if (v) return `${Number(v).toFixed(2)} €`;
  }
  return null;
}

function parseNumber(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw !== "string") return null;
  const cleaned = raw.replace(/\s/g, "").replace(",", ".").replace(/[^\d.]/g, "");
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

function parseCount(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw !== "string") return null;
  const cleaned = raw.replace(/\s/g, "").replace(/[^\d]/g, "");
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

function withAffiliate(url: string, asin: string): string {
  const base = asin ? `https://www.amazon.fr/dp/${asin}` : url;
  try {
    const parsed = new URL(base);
    parsed.hostname = "www.amazon.fr";
    parsed.searchParams.set("tag", AFFILIATE_TAG);
    return parsed.toString();
  } catch {
    return asin ? `https://www.amazon.fr/dp/${asin}?tag=${AFFILIATE_TAG}` : url;
  }
}

function scoreItem(item: {
  asin: string;
  nom: string;
  prix: string | null;
  image: string | null;
  rating: number | null;
  reviewsCount: number | null;
}, query: string, source: "amazon" | "asmodee") {
  const text = normalize(`${item.nom} ${query}`);
  const normalizedQuery = normalize(query);
  const raisons: string[] = [];
  const alertes: string[] = [];
  let score = 0;

  if (item.asin) {
    score += 12;
    raisons.push("ASIN présent");
  }
  if (item.image) {
    score += 8;
    raisons.push("image produit");
  }
  if (item.prix) {
    score += 8;
    raisons.push("prix FR");
  }
  if (item.rating && item.rating >= 4) {
    score += 8;
    raisons.push(`${item.rating.toFixed(1)}/5`);
  }
  if (item.reviewsCount && item.reviewsCount >= 100) {
    score += Math.min(18, Math.floor(item.reviewsCount / 100));
    raisons.push(`${item.reviewsCount} avis`);
  }
  if (BOARD_GAME_TERMS.some((term) => text.includes(term))) {
    score += 22;
    raisons.push("signal jeu de société");
  }
  if (source === "asmodee") {
    score += 12;
    raisons.push("source Asmodée");
  }
  if (normalizedQuery && normalize(item.nom).includes(normalizedQuery.replace(/\bjeu de societe\b/g, "").trim())) {
    score += 12;
    raisons.push("nom proche de la recherche");
  }

  for (const term of STRONG_EXCLUDED_TERMS) {
    if (text.includes(term)) {
      score -= 55;
      alertes.push(`exclu: ${term}`);
    }
  }
  for (const term of SOFT_WARNING_TERMS) {
    if (text.includes(term)) {
      score -= 14;
      alertes.push(`à vérifier: ${term}`);
    }
  }

  const scoreLabel = score >= 70 ? "excellent" : score >= 50 ? "bon" : "moyen";
  return { score, scoreLabel: scoreLabel as ApifyProduct["scoreLabel"], raisons, alertes };
}

function parseItem(item: Record<string, unknown>, source: "amazon" | "asmodee", query: string): ApifyProduct | null {
  const asin = (item.asin ?? "") as string;
  const rawTitle = String(item.title ?? item.name ?? item.productTitle ?? "");
  const nom = cleanTitle(rawTitle);
  const prix = parsePrice(item.price);
  const image = (item.thumbnailImage ?? item.image ?? item.mainImage ?? null) as string | null;
  const rawUrl = String(item.url ?? (asin ? `https://www.amazon.fr/dp/${asin}` : ""));
  const url = withAffiliate(rawUrl, asin);
  const rating = parseNumber(item.rating ?? item.stars ?? item.reviewRating);
  const reviewsCount = parseCount(item.reviewsCount ?? item.reviewCount ?? item.reviews);

  if (!asin || !nom) return null;

  const scoring = scoreItem({ asin, nom, prix, image, rating, reviewsCount }, query, source);
  if (scoring.score < REQUIRED_SCORE) return null;

  return {
    asin,
    nom,
    prix,
    image,
    url,
    source,
    normalizedName: normalize(nom),
    rating,
    reviewsCount,
    ...scoring,
  };
}

export async function POST(req: NextRequest) {
  if (!APIFY_TOKEN) {
    return NextResponse.json({ error: "APIFY_API_TOKEN manquant" }, { status: 500 });
  }

  const body = await req.json().catch(() => ({}));
  const amazonUrl = (body.amazonUrl as string | undefined) ?? "";
  const query = String(body.query ?? body.nom ?? "").trim();
  const maxItems = Math.min(Number(body.maxItems ?? 20), 200);
  const source: "amazon" | "asmodee" = body.source === "asmodee" ? "asmodee" : "amazon";

  if (!amazonUrl) {
    return NextResponse.json({ error: "amazonUrl requis" }, { status: 400 });
  }

  const input = {
    categoryOrProductUrls: [{ url: amazonUrl, method: "GET", headers: { "Accept-Language": "fr-FR,fr;q=0.9" } }],
    maxItemsPerStartUrl: maxItems,
    scrapeProductDetails: true,
    locationDeliverableRoutes: ["PRODUCT", "SEARCH", "OFFERS"],
    maxConcurrency: 2,
    minConcurrency: 1,
    proxyCountry: "FR",
  };

  try {
    const runRes = await fetch(
      `https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items?token=${APIFY_TOKEN}&timeout=600&memory=1024`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(660_000),
      }
    );

    if (!runRes.ok) {
      const text = await runRes.text();
      return NextResponse.json({ error: `Apify error ${runRes.status}: ${text}` }, { status: 502 });
    }

    const raw: Record<string, unknown>[] = await runRes.json();
    const products = raw
      .map((item) => parseItem(item, source, query || amazonUrl))
      .filter((item): item is ApifyProduct => item !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.min(maxItems, 40));

    return NextResponse.json({
      products,
      meta: {
        rawCount: raw.length,
        keptCount: products.length,
        minScore: REQUIRED_SCORE,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
