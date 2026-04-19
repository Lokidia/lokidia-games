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

const DESACTIVER = ["Aventure", "Bluff", "Combat", "Créativité", "Négociation"];
const RATTACHER_A_GENRES = ["Expert"];

async function main() {
  console.log("══════════════════════════════════════════");
  console.log("  fix-orphan-categories");
  console.log("══════════════════════════════════════════\n");

  // 1. Trouver le parent "Genres"
  const { data: genresRow, error: genresErr } = await sb
    .from("categories")
    .select("id, nom, slug")
    .ilike("nom", "genres")
    .maybeSingle();

  if (genresErr) {
    console.error("❌  Erreur recherche Genres :", genresErr.message);
    process.exit(1);
  }
  if (!genresRow) {
    console.error("❌  Catégorie 'Genres' introuvable — vérifie le nom exact dans Supabase.");
    process.exit(1);
  }
  console.log(`✓ Groupe parent trouvé : "${genresRow.nom}" (id: ${genresRow.id})\n`);

  // 2. Désactiver les catégories orphelines sans groupe pertinent
  console.log(`── Désactivation : ${DESACTIVER.join(", ")}\n`);
  for (const nom of DESACTIVER) {
    const { data: row, error: findErr } = await sb
      .from("categories")
      .select("id, nom")
      .ilike("nom", nom)
      .maybeSingle();

    if (findErr) { console.error(`  ✗ ${nom} — erreur : ${findErr.message}`); continue; }
    if (!row)    { console.log(`  ~ ${nom} — introuvable (ignoré)`); continue; }

    const { error: updErr } = await sb
      .from("categories")
      .update({ actif: false })
      .eq("id", row.id);

    if (updErr) console.error(`  ✗ ${nom} — ${updErr.message}`);
    else        console.log(`  ✓ ${nom} désactivé`);
  }

  // 3. Rattacher "Expert" à "Genres"
  console.log(`\n── Rattachement à Genres : ${RATTACHER_A_GENRES.join(", ")}\n`);
  for (const nom of RATTACHER_A_GENRES) {
    const { data: row, error: findErr } = await sb
      .from("categories")
      .select("id, nom")
      .ilike("nom", nom)
      .maybeSingle();

    if (findErr) { console.error(`  ✗ ${nom} — erreur : ${findErr.message}`); continue; }
    if (!row)    { console.log(`  ~ ${nom} — introuvable (ignoré)`); continue; }

    const { error: updErr } = await sb
      .from("categories")
      .update({ parent_id: genresRow.id, actif: true })
      .eq("id", row.id);

    if (updErr) console.error(`  ✗ ${nom} — ${updErr.message}`);
    else        console.log(`  ✓ ${nom} → parent_id = ${genresRow.id} (Genres), actif = true`);
  }

  console.log("\n══════════════════════════════════════════");
  console.log("  Terminé");
  console.log("══════════════════════════════════════════\n");
}

main().catch(err => { console.error(err); process.exit(1); });
