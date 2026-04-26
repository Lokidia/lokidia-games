import { NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase/service";

type Params = { params: Promise<{ slug: string }> };

const RATE_MS = 800;
function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

function normalize(nom: string): string {
  return nom
    .replace(/\s*[-–:]\s*(vf|version française|jeu de société|board game).*/i, "")
    .replace(/^\s*(asmodee|gigamic|iello|repos prod)\s*[-–:]\s*/i, "")
    .trim();
}

function extractAsin(url: string): string | null {
  const m = url.match(/\/dp\/([A-Z0-9]{10})/i);
  return m ? m[1] : null;
}

interface UPCItem { ean: string; title: string; category?: string }
interface UPCResponse { code: string; items?: UPCItem[] }

async function searchUPC(query: string, apiKey: string): Promise<string | null> {
  const base = "https://api.upcitemdb.com/prod/trial/search";
  const params = new URLSearchParams({ s: query, type: "product" });
  const headers: Record<string, string> = { Accept: "application/json" };
  if (apiKey) headers["user_key"] = apiKey;

  try {
    const res = await fetch(`${base}?${params}`, { headers, signal: AbortSignal.timeout(8000) });
    if (res.status === 429) return null;
    if (!res.ok) return null;
    const data = await res.json() as UPCResponse;
    if (data.code !== "OK" || !data.items?.length) return null;
    const best = data.items.find((i) =>
      /game|jeu|board/i.test(i.category ?? "") || /game|jeu|board/i.test(i.title)
    ) ?? data.items[0];
    return best.ean || null;
  } catch { return null; }
}

async function searchApify(nom: string, apifyKey: string): Promise<string | null> {
  if (!apifyKey) return null;
  try {
    const body = {
      queries: [`${nom} jeu de société EAN barcode`],
      maxPagesPerQuery: 1,
      countryCode: "fr",
      languageCode: "fr",
    };
    const res = await fetch(
      `https://api.apify.com/v2/acts/apify~google-shopping-scraper/run-sync-get-dataset-items?token=${apifyKey}&timeout=30`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(35000) }
    );
    if (!res.ok) return null;
    const items = await res.json() as Array<{ gtin?: string; ean?: string; title?: string }>;
    for (const item of items) {
      const code = item.gtin ?? item.ean;
      if (code && /^\d{8,14}$/.test(code)) return code;
    }
    return null;
  } catch { return null; }
}

export async function POST(_: Request, { params }: Params) {
  const { slug } = await params;
  const sb = createServiceClient();

  const { data: jeu } = await sb
    .from("jeux")
    .select("id, nom, ean, jeux_prix(marchand, url)")
    .eq("slug", slug)
    .single();

  if (!jeu) return NextResponse.json({ error: "Jeu introuvable" }, { status: 404 });

  const row = jeu as unknown as {
    id: string; nom: string; ean: string | null;
    jeux_prix: { marchand: string; url: string }[];
  };

  const nom = normalize(row.nom);
  const upcKey = process.env.UPCITEMDB_KEY ?? "";
  const apifyKey = process.env.APIFY_KEY ?? "";

  let ean: string | null = null;

  // 1. ASIN → UPCitemdb
  const amazonEntry = (row.jeux_prix ?? []).find((p) => p.marchand === "amazon" && p.url);
  if (amazonEntry) {
    const asin = extractAsin(amazonEntry.url);
    if (asin) {
      ean = await searchUPC(asin, upcKey);
      if (!ean) await sleep(RATE_MS);
    }
  }

  // 2. UPCitemdb by name
  if (!ean) {
    ean = await searchUPC(`${nom} board game`, upcKey);
    await sleep(RATE_MS);
  }

  // 3. UPCitemdb by French name
  if (!ean) {
    ean = await searchUPC(`${nom} jeu de société`, upcKey);
    await sleep(RATE_MS);
  }

  // 4. Apify Google Shopping
  if (!ean) {
    ean = await searchApify(nom, apifyKey);
  }

  if (!ean) {
    return NextResponse.json({ found: false, message: "EAN introuvable" });
  }

  const { error } = await sb.from("jeux").update({ ean }).eq("id", row.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ found: true, ean });
}
