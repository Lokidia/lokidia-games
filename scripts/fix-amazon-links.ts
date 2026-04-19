/**
 * scripts/fix-amazon-links.ts
 *
 * Pour chaque jeu dans Supabase, remplace l'URL Amazon dans jeux_prix
 * par une URL de recherche Amazon fiable :
 *   https://www.amazon.fr/s?k=NOM+DU+JEU+jeu+de+société&tag=lokidia21-21
 *
 * Run: npm run fix-amazon-links
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

const AFFILIATE_TAG = "lokidia21-21";

function buildSearchUrl(nom: string): string {
  const query = encodeURIComponent(`${nom} jeu de société`);
  return `https://www.amazon.fr/s?k=${query}&tag=${AFFILIATE_TAG}`;
}

async function main() {
  console.log("══════════════════════════════════════════");
  console.log("  fix-amazon-links — URLs de recherche");
  console.log("══════════════════════════════════════════\n");

  // 1. Récupère tous les jeux
  const { data: jeux, error: jeuxErr } = await sb
    .from("jeux")
    .select("id, nom")
    .order("nom");

  if (jeuxErr || !jeux) {
    console.error("❌  Erreur de lecture des jeux :", jeuxErr?.message);
    process.exit(1);
  }

  console.log(`${jeux.length} jeu(x) trouvé(s)\n`);

  let updated = 0;
  let inserted = 0;
  let errors = 0;

  for (const jeu of jeux) {
    const searchUrl = buildSearchUrl(jeu.nom);

    // Upsert : crée ou met à jour la ligne Amazon pour ce jeu
    const { error } = await sb
      .from("jeux_prix")
      .upsert(
        { jeu_id: jeu.id, marchand: "amazon", url: searchUrl, prix: "" },
        { onConflict: "jeu_id,marchand" },
      );

    if (error) {
      console.error(`  ✗ ${jeu.nom} — ${error.message}`);
      errors++;
    } else {
      console.log(`  ✓ ${jeu.nom}`);
      console.log(`      ${searchUrl}`);
      updated++;
    }
  }

  console.log(`
══════════════════════════════════════════
  Terminé
  ✓ ${updated} URL(s) mises à jour / créées
  ✗ ${errors} erreur(s)
══════════════════════════════════════════
`);
}

main().catch(err => { console.error(err); process.exit(1); });
