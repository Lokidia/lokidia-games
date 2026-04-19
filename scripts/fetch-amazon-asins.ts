/**
 * scripts/fetch-amazon-asins.ts
 *
 * Pour chaque jeu dans Supabase, scrape la page de recherche Amazon,
 * extrait le premier ASIN et met à jour jeux_prix avec l'URL directe.
 *
 * Run: npm run fetch-amazon-asins
 */

import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌  Variables d'environnement manquantes");
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const RATE_LIMIT_MS = 3000;
const AFFILIATE_TAG = "lokidia21-21";

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
  "Accept-Encoding": "gzip, deflate, br",
  "Cache-Control": "no-cache",
  "Pragma": "no-cache",
};

function buildSearchUrl(nom: string): string {
  return `https://www.amazon.fr/s?k=${encodeURIComponent(nom + " jeu de société")}`;
}

function extractFirstAsin(html: string): string | null {
  // 1. data-asin attribute (most reliable)
  const dataAsin = html.match(/data-asin="([A-Z0-9]{10})"/);
  if (dataAsin?.[1]) return dataAsin[1];

  // 2. /dp/XXXXXXXXXX/ in product links
  const dpLink = html.match(/\/dp\/([A-Z0-9]{10})\//);
  if (dpLink?.[1]) return dpLink[1];

  // 3. "asin":"XXXXXXXXXX" in JSON
  const jsonAsin = html.match(/"asin"\s*:\s*"([A-Z0-9]{10})"/);
  if (jsonAsin?.[1]) return jsonAsin[1];

  return null;
}

async function fetchAsin(nom: string): Promise<string | null> {
  const url = buildSearchUrl(nom);
  try {
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) {
      console.error(`    HTTP ${res.status} pour "${nom}"`);
      return null;
    }
    const html = await res.text();

    // Détection CAPTCHA
    if (html.includes("robot") || html.includes("captcha") || html.includes("Enter the characters you see below")) {
      console.error(`    ⚠️  CAPTCHA détecté pour "${nom}" — pause prolongée recommandée`);
      return null;
    }

    return extractFirstAsin(html);
  } catch (err) {
    console.error(`    Erreur fetch pour "${nom}":`, err);
    return null;
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log("══════════════════════════════════════════");
  console.log("  fetch-amazon-asins — URLs directes");
  console.log("══════════════════════════════════════════\n");

  const { data: jeux, error } = await sb
    .from("jeux")
    .select("id, nom")
    .order("nom");

  if (error || !jeux) {
    console.error("❌  Erreur lecture jeux :", error?.message);
    process.exit(1);
  }

  console.log(`${jeux.length} jeu(x) à traiter\n`);

  let updated = 0;
  let notFound = 0;
  let errors = 0;

  for (let i = 0; i < jeux.length; i++) {
    const jeu = jeux[i];
    console.log(`[${i + 1}/${jeux.length}] ${jeu.nom}`);

    const asin = await fetchAsin(jeu.nom);

    if (!asin) {
      console.log(`    ~ Aucun ASIN trouvé — URL de recherche conservée`);
      notFound++;
    } else {
      const productUrl = `https://www.amazon.fr/dp/${asin}?tag=${AFFILIATE_TAG}`;
      console.log(`    ✓ ASIN: ${asin} → ${productUrl}`);

      const { error: updErr } = await sb
        .from("jeux_prix")
        .upsert(
          { jeu_id: jeu.id, marchand: "amazon", url: productUrl, prix: "" },
          { onConflict: "jeu_id,marchand" },
        );

      if (updErr) {
        console.error(`    ✗ Erreur update: ${updErr.message}`);
        errors++;
      } else {
        updated++;
      }
    }

    if (i < jeux.length - 1) {
      await sleep(RATE_LIMIT_MS);
    }
  }

  console.log(`
══════════════════════════════════════════
  Terminé
  ✓ ${updated} ASIN(s) mis à jour
  ~ ${notFound} non trouvés (URL de recherche conservée)
  ✗ ${errors} erreur(s)
══════════════════════════════════════════
`);
}

main().catch(err => { console.error(err); process.exit(1); });
