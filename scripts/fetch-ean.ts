/**
 * scripts/fetch-ean.ts
 *
 * Pour chaque jeu dans Supabase sans EAN :
 *   1. Cherche l'EAN via l'URL Amazon (ASIN → recherche UPCitemdb)
 *   2. Sinon, cherche via le nom du jeu sur UPCitemdb
 *   3. Sauvegarde dans jeux.ean
 *
 * Run: npm run fetch-ean
 *
 * Note : l'API UPCitemdb trial est limitée à 100 req/jour sans clé.
 *        Définir UPCITEMDB_KEY dans .env.local pour lever cette limite.
 */

import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const UPCITEMDB_KEY = process.env.UPCITEMDB_KEY ?? "";

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌  Variables Supabase manquantes");
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const RATE_MS = 1500;

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Extracts ASIN from an Amazon URL, e.g. /dp/B07XYZ → B07XYZ */
function extractAsin(url: string): string | null {
  const m = url.match(/\/dp\/([A-Z0-9]{10})/i);
  return m ? m[1] : null;
}

/** Normalize a game name for better search results */
function normalize(nom: string): string {
  return nom
    .replace(/\s*[-–:]\s*(vf|version française|jeu de société|board game).*/i, "")
    .replace(/^\s*(asmodee|gigamic|iello|repos prod)\s*[-–:]\s*/i, "")
    .trim();
}

interface UPCItem {
  ean: string;
  title: string;
  category?: string;
}
interface UPCResponse {
  code: string;
  items?: UPCItem[];
}

/** Search UPCitemdb by query string. Returns the first EAN found, or null. */
async function searchUPC(query: string): Promise<string | null> {
  const base = "https://api.upcitemdb.com/prod/trial/search";
  const params = new URLSearchParams({ s: query, type: "product" });
  const headers: Record<string, string> = { "Accept": "application/json" };
  if (UPCITEMDB_KEY) headers["user_key"] = UPCITEMDB_KEY;

  try {
    const res = await fetch(`${base}?${params}`, { headers });
    if (res.status === 429) { console.warn("    ⚠  Rate-limit UPCitemdb — attente 10s"); await sleep(10_000); return null; }
    if (!res.ok) return null;

    const data = await res.json() as UPCResponse;
    if (data.code !== "OK" || !data.items?.length) return null;

    // Prefer items with "game" in category or title
    const best = data.items.find((i) =>
      /game|jeu|board/i.test(i.category ?? "") || /game|jeu|board/i.test(i.title)
    ) ?? data.items[0];

    return best.ean || null;
  } catch {
    return null;
  }
}

/** Look up EAN by ASIN via UPCitemdb lookup endpoint */
async function lookupByAsin(asin: string): Promise<string | null> {
  // UPCitemdb does not support ASIN lookup directly; search by ASIN as keyword
  return searchUPC(asin);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🔍  Fetch EAN pour les jeux Supabase\n");

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

    // 1. Try to get EAN from Amazon ASIN
    const amazonEntry = (row.jeux_prix ?? []).find((p) => p.marchand === "amazon" && p.url);
    if (amazonEntry) {
      const asin = extractAsin(amazonEntry.url);
      if (asin) {
        console.log(`    🛒  ASIN: ${asin} — recherche UPCitemdb…`);
        ean = await lookupByAsin(asin);
        await sleep(RATE_MS);
      }
    }

    // 2. Fallback: search by game name
    if (!ean) {
      console.log(`    🔎  Recherche par nom : "${nom}"`);
      ean = await searchUPC(`${nom} board game`);
      await sleep(RATE_MS);
    }

    if (ean) {
      const { error: upErr } = await sb.from("jeux").update({ ean }).eq("id", row.id);
      if (upErr) {
        console.warn(`    ⚠  Supabase: ${upErr.message}`);
        skipped++;
      } else {
        console.log(`    ✅  EAN: ${ean}`);
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
