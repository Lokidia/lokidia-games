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

const AFFILIATE_TAG = "tag=lokidia21-21";

async function main() {
  console.log("══════════════════════════════════════════");
  console.log("  fix-amazon-tags — ajout tag affilié");
  console.log("══════════════════════════════════════════\n");

  const { data, error } = await sb
    .from("jeux_prix")
    .select("id, url, jeu_id")
    .eq("marchand", "amazon");

  if (error) {
    console.error("❌  Erreur de lecture :", error.message);
    process.exit(1);
  }

  const rows = data ?? [];
  console.log(`${rows.length} ligne(s) Amazon trouvée(s)\n`);

  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    if (!row.url || !row.url.startsWith("http")) {
      console.log(`  ~ (vide) — ignoré`);
      skipped++;
      continue;
    }
    if (row.url.includes("tag=")) {
      console.log(`  ~ ${row.url.slice(0, 60)}… — tag déjà présent`);
      skipped++;
      continue;
    }

    const sep = row.url.includes("?") ? "&" : "?";
    const newUrl = `${row.url}${sep}${AFFILIATE_TAG}`;

    const { error: updErr } = await sb
      .from("jeux_prix")
      .update({ url: newUrl })
      .eq("id", row.id);

    if (updErr) {
      console.error(`  ✗ ${row.id} — ${updErr.message}`);
    } else {
      console.log(`  ✓ ${newUrl.slice(0, 80)}`);
      updated++;
    }
  }

  console.log(`
══════════════════════════════════════════
  Terminé
  ✓ ${updated} URL(s) mises à jour
  ~ ${skipped} ignorée(s)
══════════════════════════════════════════
`);
}

main().catch(err => { console.error(err); process.exit(1); });
