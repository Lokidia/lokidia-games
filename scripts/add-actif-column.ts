/**
 * scripts/add-actif-column.ts
 *
 * Vérifie si les colonnes `actif` existent dans jeux et categories.
 * Si non, affiche le SQL à coller dans Supabase SQL Editor.
 *
 * Run: npm run add-actif-column
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

const SQL = `
ALTER TABLE jeux       ADD COLUMN IF NOT EXISTS actif boolean NOT NULL DEFAULT true;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS actif boolean NOT NULL DEFAULT true;
`.trim();

async function checkColumn(table: string): Promise<boolean> {
  const { error } = await sb.from(table).select("actif").limit(1);
  return !error;
}

async function main() {
  console.log("══════════════════════════════════════════");
  console.log("  add-actif-column — vérification migration");
  console.log("══════════════════════════════════════════\n");

  const [jeuxOk, catsOk] = await Promise.all([
    checkColumn("jeux"),
    checkColumn("categories"),
  ]);

  if (jeuxOk && catsOk) {
    console.log("✅  Les colonnes `actif` existent déjà dans les deux tables.");
    return;
  }

  console.log("⚠️  Migration requise.\n");
  if (!jeuxOk) console.log("  ✗ jeux.actif — manquant");
  if (!catsOk) console.log("  ✗ categories.actif — manquant");

  console.log(`
Colle ce SQL dans l'éditeur Supabase :
https://supabase.com/dashboard/project/_/sql/new

────────────────────────────────────────
${SQL}
────────────────────────────────────────

Fichier de référence : database/add-actif.sql
`);
}

main().catch(err => { console.error(err); process.exit(1); });
