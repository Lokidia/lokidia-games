import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { createClient } from "@supabase/supabase-js";

// ── Env ──────────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(`
❌  Variables d'environnement manquantes dans .env.local :
   NEXT_PUBLIC_SUPABASE_URL      ${SUPABASE_URL  ? "✓" : "✗ manquant"}
   SUPABASE_SERVICE_ROLE_KEY     ${SERVICE_KEY   ? "✓" : "✗ manquant"}
`);
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugify(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .trim()
    .replace(/\s+/g, "-");
}

// ── Hiérarchie cible ─────────────────────────────────────────────────────────

const HIERARCHY: { nom: string; children: string[] }[] = [
  {
    nom: "Genres",
    children: ["Stratégie", "Familial", "Coopératif", "Ambiance", "Cartes", "Dés"],
  },
  {
    nom: "Les primés",
    children: ["Spiel des Jahres", "As d'Or", "Prix Urus"],
  },
  {
    nom: "Idées cadeaux",
    children: ["Moins de 20€", "Pour enfants", "Pour gamers", "En couple"],
  },
  {
    nom: "Les mieux notés",
    children: ["Top 10", "Top Famille", "Top Expert"],
  },
  {
    nom: "Par joueurs",
    children: ["Solo", "À 2", "Entre amis", "Grande tablée"],
  },
  {
    nom: "Durée",
    children: ["Apéro", "Soirée", "Marathon"],
  },
  {
    nom: "Nouveautés",
    children: ["Sorties 2024", "Kickstarter", "Tendances"],
  },
  {
    nom: "Thèmes",
    children: ["Médiéval", "Science-fiction", "Nature", "Enquête"],
  },
];

// ── Script ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🗂️  Fix hiérarchie catégories → méga menu\n" + "─".repeat(52));
  console.log(`   Supabase : ${SUPABASE_URL}\n`);

  // Snapshot de l'état avant pour détecter créations vs mises à jour
  const { data: before } = await sb.from("categories").select("slug, parent_id");
  const existingSlugs = new Set((before ?? []).map((c: { slug: string }) => c.slug));

  let nbCreated  = 0;
  let nbUpdated  = 0;
  let nbErrors   = 0;

  for (const group of HIERARCHY) {
    const rootSlug = slugify(group.nom);

    // 1. Upsert de la catégorie racine (parent_id = null)
    const { data: rootRow, error: rootErr } = await sb
      .from("categories")
      .upsert(
        { slug: rootSlug, nom: group.nom, type: "category", parent_id: null },
        { onConflict: "slug" },
      )
      .select("id, slug, nom, parent_id")
      .single();

    if (rootErr || !rootRow) {
      console.error(`  ❌ Racine "${group.nom}" : ${rootErr?.message ?? "réponse vide"}`);
      nbErrors++;
      continue;
    }

    const root = rootRow as { id: string; slug: string; nom: string; parent_id: string | null };
    const rootIsNew = !existingSlugs.has(root.slug);
    console.log(`\n  📁 ${root.nom}  [${root.slug}]  ${rootIsNew ? "✨ créé" : "→ mis à jour (parent_id = null)"}`);
    rootIsNew ? nbCreated++ : nbUpdated++;

    // 2. Upsert de chaque enfant avec parent_id = root.id
    for (const childNom of group.children) {
      const childSlug = slugify(childNom);
      const childIsNew = !existingSlugs.has(childSlug);

      const { data: childRow, error: childErr } = await sb
        .from("categories")
        .upsert(
          { slug: childSlug, nom: childNom, type: "category", parent_id: root.id },
          { onConflict: "slug" },
        )
        .select("id, slug, nom")
        .single();

      if (childErr || !childRow) {
        console.error(`     ❌ Enfant "${childNom}" : ${childErr?.message ?? "réponse vide"}`);
        nbErrors++;
        continue;
      }

      const child = childRow as { id: string; slug: string; nom: string };
      console.log(`     ${childIsNew ? "✨" : "✅"} ${child.nom}  [${child.slug}]  ${childIsNew ? "créé" : "parent_id → " + root.slug}`);
      childIsNew ? nbCreated++ : nbUpdated++;
    }
  }

  // 3. Résumé
  console.log("\n" + "═".repeat(52));
  console.log(`✔  Terminé : ${nbCreated} créé(s)  |  ${nbUpdated} mis à jour  |  ${nbErrors} erreur(s)`);
  console.log(`   Vérification : ${SUPABASE_URL}/project/default/editor`);
  console.log();
}

main().catch((err) => {
  console.error("\n❌ Erreur fatale :", err);
  process.exit(1);
});
