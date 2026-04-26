/**
 * scripts/fetch-ean.ts
 *
 * Pour chaque jeu dans Supabase sans EAN, cherche en cascade :
 *   1. UPCitemdb par ASIN Amazon (si URL Amazon présente)
 *   2. UPCitemdb par nom du jeu
 *   3. UPCitemdb par nom + "jeu de société"
 *   4. Apify Google Shopping Scraper (si APIFY_KEY défini)
 *   5. Sauvegarde dans jeux.ean
 *
 * Run: npm run fetch-ean
 *
 * Variables d'environnement optionnelles :
 *   UPCITEMDB_KEY  — clé API UPCitemdb (trial sans clé : 100 req/jour)
 *   APIFY_KEY      — token Apify pour Google Shopping (dernier recours)
 */

import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const UPCITEMDB_KEY = process.env.UPCITEMDB_KEY ?? "";
const APIFY_KEY     = process.env.APIFY_KEY ?? "";

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌  Variables Supabase manquantes");
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const RATE_MS = 1500;

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

function extractAsin(url: string): string | null {
  const m = url.match(/\/dp\/([A-Z0-9]{10})/i);
  return m ? m[1] : null;
}

function normalize(nom: string): string {
  return nom
    .replace(/\s*[-–:]\s*(vf|version française|jeu de société|board game).*/i, "")
    .replace(/^\s*(asmodee|gigamic|iello|repos prod)\s*[-–:]\s*/i, "")
    .trim();
}

interface UPCItem { ean: string; title: string; category?: string }
interface UPCResponse { code: string; items?: UPCItem[] }

async function searchUPC(query: string): Promise<string | null> {
  const base = "https://api.upcitemdb.com/prod/trial/search";
  const params = new URLSearchParams({ s: query, type: "product" });
  const headers: Record<string, string> = { Accept: "application/json" };
  if (UPCITEMDB_KEY) headers["user_key"] = UPCITEMDB_KEY;

  try {
    const res = await fetch(`${base}?${params}`, { headers });
    if (res.status === 429) {
      console.warn("    ⚠  Rate-limit UPCitemdb — attente 10s");
      await sleep(10_000);
      return null;
    }
    if (!res.ok) return null;
    const data = await res.json() as UPCResponse;
    if (data.code !== "OK" || !data.items?.length) return null;
    const best = data.items.find((i) =>
      /game|jeu|board/i.test(i.category ?? "") || /game|jeu|board/i.test(i.title)
    ) ?? data.items[0];
    return best.ean || null;
  } catch { return null; }
}

async function searchApify(nom: string): Promise<string | null> {
  if (!APIFY_KEY) return null;
  console.log(`    🌐  Apify Google Shopping : "${nom}"…`);
  try {
    const body = {
      queries: [`${nom} jeu de société EAN barcode`],
      maxPagesPerQuery: 1,
      countryCode: "fr",
      languageCode: "fr",
    };
    const res = await fetch(
      `https://api.apify.com/v2/acts/apify~google-shopping-scraper/run-sync-get-dataset-items?token=${APIFY_KEY}&timeout=30`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
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

async function main() {
  console.log("🔍  Fetch EAN pour les jeux Supabase\n");
  if (APIFY_KEY) console.log("✅  Apify activé (Google Shopping fallback)\n");

  const { data: jeux, error } = await sb
    .from("jeux")
    .select("id, nom, jeux_prix(marchand, url)")
    .is("ean", null)
    .eq("actif", true)
    .order("nom");

  if (error) { console.error("❌  Supabase:", error.message); process.exit(1); }
  if (!jeux?.length) { console.log("✅  Tous les jeux ont déjà un EAN."); return; }

  console.log(`📋  ${jeux.length} jeu(x) sans EAN\n`);

  let found = 0;
  let skipped = 0;

  for (const jeu of jeux) {
    const row = jeu as unknown as {
      id: string;
      nom: string;
      jeux_prix: { marchand: string; url: string }[];
    };

    const nom = normalize(row.nom);
    console.log(`🎲  ${row.nom}`);

    let ean: string | null = null;

    // 1. ASIN → UPCitemdb
    const amazonEntry = (row.jeux_prix ?? []).find((p) => p.marchand === "amazon" && p.url);
    if (amazonEntry) {
      const asin = extractAsin(amazonEntry.url);
      if (asin) {
        console.log(`    🛒  ASIN: ${asin} — recherche UPCitemdb…`);
        ean = await searchUPC(asin);
        if (ean) { console.log(`    ✅  EAN via ASIN: ${ean}`); }
        else await sleep(RATE_MS);
      }
    }

    // 2. UPCitemdb by name (English style)
    if (!ean) {
      console.log(`    🔎  UPCitemdb par nom : "${nom} board game"`);
      ean = await searchUPC(`${nom} board game`);
      if (ean) { console.log(`    ✅  EAN via nom (EN): ${ean}`); }
      else await sleep(RATE_MS);
    }

    // 3. UPCitemdb by French name
    if (!ean) {
      console.log(`    🔎  UPCitemdb par nom FR : "${nom} jeu de société"`);
      ean = await searchUPC(`${nom} jeu de société`);
      if (ean) { console.log(`    ✅  EAN via nom (FR): ${ean}`); }
      else await sleep(RATE_MS);
    }

    // 4. Apify Google Shopping
    if (!ean) {
      ean = await searchApify(nom);
      if (ean) console.log(`    ✅  EAN via Apify: ${ean}`);
    }

    if (ean) {
      const { error: upErr } = await sb.from("jeux").update({ ean }).eq("id", row.id);
      if (upErr) {
        console.warn(`    ⚠  Supabase: ${upErr.message}`);
        skipped++;
      } else {
        found++;
      }
    } else {
      console.log("    ⏭  EAN introuvable — ignoré");
      skipped++;
    }

    console.log("");
  }

  console.log(`\n✅  Terminé — ${found} EAN trouvés, ${skipped} ignorés`);
}

main().catch((err) => { console.error("❌", err); process.exit(1); });
