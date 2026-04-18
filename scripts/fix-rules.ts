/**
 * scripts/fix-rules.ts
 *
 * 1. Supprime le jeu 'vildhjarta' de Supabase (pas un jeu de société).
 * 2. Restaure le champ `regles` pour les 30 jeux d'origine depuis src/data/jeux.ts
 *    en faisant correspondre par slug.
 *
 * Run: npm run fix-rules
 */

import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { createClient } from "@supabase/supabase-js";
import { jeux } from "../src/data/jeux";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌  Variables d'environnement manquantes");
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

async function main() {
  console.log("══════════════════════════════════════════");
  console.log("  fix-rules — nettoyage & restauration");
  console.log("══════════════════════════════════════════\n");

  // ── 1. Supprimer Vildhjarta ───────────────────────────────────────────────
  console.log("── Étape 1 : suppression de 'vildhjarta' ──\n");

  const { data: found, error: findErr } = await sb
    .from("jeux")
    .select("id, nom, slug")
    .ilike("slug", "%vildhjarta%");

  if (findErr) {
    console.error("  Erreur de recherche :", findErr.message);
  } else if (!found || found.length === 0) {
    console.log("  Introuvable — déjà supprimé ou jamais importé.");
  } else {
    for (const row of found) {
      console.log(`  Suppression : "${row.nom}" (${row.slug})`);
      // jeux_categories + jeux_prix ont ON DELETE CASCADE
      const { error: delErr } = await sb.from("jeux").delete().eq("id", row.id);
      if (delErr) {
        console.error(`  ✗ Erreur : ${delErr.message}`);
      } else {
        console.log("  ✓ Supprimé");
      }
    }
  }

  // ── 2. Restaurer les règles des 30 jeux d'origine ────────────────────────
  console.log("\n── Étape 2 : restauration des règles ──\n");

  // Build slug → regles map from jeux.ts
  const reglesBySlug = new Map(jeux.map(j => [j.slug, j.regles]));
  console.log(`  ${reglesBySlug.size} jeux à mettre à jour depuis src/data/jeux.ts\n`);

  let updated = 0, notFound = 0, errors = 0;

  for (const [slug, regles] of reglesBySlug) {
    if (!regles || regles.length === 0) continue;

    const { data: row, error: fetchErr } = await sb
      .from("jeux")
      .select("id, nom")
      .eq("slug", slug)
      .maybeSingle();

    if (fetchErr) {
      console.error(`  ✗ ${slug} — erreur fetch : ${fetchErr.message}`);
      errors++;
      continue;
    }

    if (!row) {
      console.log(`  ~ ${slug} — introuvable en base (ignoré)`);
      notFound++;
      continue;
    }

    const { error: updateErr } = await sb
      .from("jeux")
      .update({ regles })
      .eq("id", row.id);

    if (updateErr) {
      console.error(`  ✗ ${slug} — erreur update : ${updateErr.message}`);
      errors++;
    } else {
      console.log(`  ✓ ${row.nom} — ${regles.length} règles restaurées`);
      updated++;
    }
  }

  console.log(`
══════════════════════════════════════════
  Terminé
  ✓ ${updated} jeux mis à jour
  ~ ${notFound} slugs absents de la base
  ✗ ${errors} erreurs
══════════════════════════════════════════
`);
}

main().catch(err => { console.error(err); process.exit(1); });
