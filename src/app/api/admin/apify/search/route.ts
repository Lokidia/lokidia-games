import { NextRequest, NextResponse } from "next/server";

export interface ApifyProduct {
  asin: string;
  nom: string;
  prix: string | null;
  image: string | null;
  url: string;
  source: "amazon" | "asmodee";
}

const ACTOR_ID = "junglee~Amazon-crawler";
const APIFY_TOKEN = process.env.APIFY_API_TOKEN ?? "";

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

function parseItem(item: Record<string, unknown>, source: "amazon" | "asmodee"): ApifyProduct {
  const asin = (item.asin ?? "") as string;
  const nom = (item.title ?? "") as string;
  const prix = parsePrice(item.price);
  const image = (item.thumbnailImage ?? null) as string | null;
  const url = (item.url ?? (asin ? `https://www.amazon.fr/dp/${asin}` : "")) as string;
  return { asin, nom, prix, image, url, source };
}

export async function POST(req: NextRequest) {
  if (!APIFY_TOKEN) {
    return NextResponse.json({ error: "APIFY_API_TOKEN manquant" }, { status: 500 });
  }

  const body = await req.json().catch(() => ({}));
  const amazonUrl = (body.amazonUrl as string | undefined) ?? "";
  const maxItems = Math.min(Number(body.maxItems ?? 5), 200);
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
      .filter((item) => item.asin && item.title)
      .map((item) => parseItem(item, source));

    return NextResponse.json({ products });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
