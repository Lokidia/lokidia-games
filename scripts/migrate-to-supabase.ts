import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { createClient } from "@supabase/supabase-js";
import { jeux } from "../src/data/jeux";
import { promises as fs } from "node:fs";
import path from "node:path";

// ── Validation des variables d'environnement ─────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(`
❌  Variables d'environnement manquantes dans .env.local :

   NEXT_PUBLIC_SUPABASE_URL      ${SUPABASE_URL ? "✓" : "✗ manquant"}
   SUPABASE_SERVICE_ROLE_KEY     ${SERVICE_KEY  ? "✓" : "✗ manquant"}

→ Récupère ta clé SERVICE_ROLE dans :
  Supabase Dashboard > Settings > API > service_role (secret)
`);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

// ── Utilitaires ───────────────────────────────────────────────────────────────

function slugify(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .trim()
    .replace(/\s+/g, "-");
}

// ── Migration ─────────────────────────────────────────────────────────────────

async function migrateJeux() {
  console.log(`\n🎲 Migration des jeux (${jeux.length})\n${"─".repeat(50)}`);

  // Pré-charge toutes les catégories existantes
  const { data: existingCats, error: catError } = await supabase
    .from("categories")
    .select("id, slug, nom");

  if (catError) throw new Error(`Lecture catégories : ${catError.message}`);

  const catBySlug = new Map(
    (existingCats ?? []).map((c) => [c.slug as string, c as { id: string; slug: string; nom: string }]),
  );

  let ok = 0;
  let ko = 0;

  for (const jeu of jeux) {
    // 1. Upsert du jeu
    const { data: jeuRow, error: jeuError } = await supabase
      .from("jeux")
      .upsert(
        {
          slug:        jeu.slug,
          nom:         jeu.nom,
          annee:       jeu.annee,
          description: jeu.description,
          joueurs_min: jeu.joueursMin,
          joueurs_max: jeu.joueursMax,
          duree_min:   jeu.dureeMin,
          duree_max:   jeu.dureeMax,
          age_min:     jeu.ageMin,
          complexite:  jeu.complexite,
          note:        jeu.note,
          mecaniques:  jeu.mecaniques,
          regles:      jeu.regles,
          image_url:   jeu.imageUrl,
        },
        { onConflict: "slug" },
      )
      .select("id")
      .single();

    if (jeuError || !jeuRow) {
      console.error(`  ❌ ${jeu.nom} : ${jeuError?.message ?? "réponse vide"}`);
      ko++;
      continue;
    }

    const jeuId = jeuRow.id as string;

    // 2. Upsert des prix (4 marchands)
    const prixRows = (["amazon", "philibert", "cultura", "fnac"] as const).map(
      (marchand) => ({
        jeu_id:   jeuId,
        marchand,
        url:      jeu.acheter[marchand].url,
        prix:     jeu.acheter[marchand].prix,
      }),
    );

    const { error: prixError } = await supabase
      .from("jeux_prix")
      .upsert(prixRows, { onConflict: "jeu_id,marchand" });

    if (prixError) {
      console.warn(`  ⚠  ${jeu.nom} – prix : ${prixError.message}`);
    }

    // 3. Liaison jeu ↔ catégories
    for (const catNom of jeu.categories) {
      const slug = slugify(catNom);
      let cat = catBySlug.get(slug);

      // Crée la catégorie si elle n'existe pas encore
      if (!cat) {
        const { data: newCat, error: newCatError } = await supabase
          .from("categories")
          .insert({ slug, nom: catNom, type: "category" })
          .select("id, slug, nom")
          .single();

        if (newCatError) {
          console.warn(`  ⚠  catégorie "${catNom}" (${slug}) : ${newCatError.message}`);
          continue;
        }
        if (newCat) {
          catBySlug.set(slug, newCat as { id: string; slug: string; nom: string });
          cat = newCat as { id: string; slug: string; nom: string };
        }
      }

      if (cat) {
        await supabase
          .from("jeux_categories")
          .upsert(
            { jeu_id: jeuId, categorie_id: cat.id },
            { onConflict: "jeu_id,categorie_id" },
          );
      }
    }

    ok++;
    console.log(`  ✅ ${jeu.nom}`);
  }

  console.log(`\n  ${ok} jeu(x) migrés  |  ${ko} erreur(s)`);
}

async function migrateSeoPages() {
  const storePath = path.join(process.cwd(), "data", "seo-pages.json");

  let records: unknown[];
  try {
    const raw = await fs.readFile(storePath, "utf8");
    records = JSON.parse(raw) as unknown[];
  } catch {
    console.log("\n📄 Pas de data/seo-pages.json — étape SEO ignorée.");
    return;
  }

  if (records.length === 0) {
    console.log("\n📄 data/seo-pages.json vide — étape SEO ignorée.");
    return;
  }

  console.log(`\n📄 Migration des pages SEO (${records.length})\n${"─".repeat(50)}`);

  let ok = 0;
  for (const r of records as Array<Record<string, unknown>>) {
    const { error } = await supabase.from("seo_pages").upsert(
      {
        input_hash:   r.input_hash,
        slug:         r.slug,
        payload_json: r.payload_json,
        status:       r.status,
        generated_at: r.generated_at,
        updated_at:   r.updated_at,
      },
      { onConflict: "input_hash" },
    );

    if (error) {
      console.error(`  ❌ ${r.slug} : ${error.message}`);
    } else {
      ok++;
    }
  }

  console.log(`  ✅ ${ok} / ${records.length} pages SEO migrées`);
}

async function main() {
  console.log(`\n🚀 Migration Lokidia Games → Supabase`);
  console.log(`   URL : ${SUPABASE_URL}\n`);

  await migrateJeux();
  await migrateSeoPages();

  console.log(`\n${"═".repeat(50)}`);
  console.log(`✔  Migration terminée`);
  console.log(`   Vérification : ${SUPABASE_URL}/project/default/editor`);
  console.log();
}

main().catch((err) => {
  console.error("\n❌ Erreur fatale :", err);
  process.exit(1);
});
