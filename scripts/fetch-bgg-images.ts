import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌ Variables d'environnement manquantes (.env.local)");
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function searchBggId(name: string): Promise<string | null> {
  // 1. Exact name search
  const exactUrl = `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(name)}&type=boardgame&exact=1`;
  try {
    const res = await fetch(exactUrl);
    const xml  = await res.text();
    const m    = xml.match(/<item type="boardgame" id="(\d+)"/);
    if (m) return m[1];
  } catch { /* network error → fall through */ }

  await sleep(1200);

  // 2. Fuzzy fallback
  const fuzzyUrl = `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(name)}&type=boardgame`;
  try {
    const res = await fetch(fuzzyUrl);
    const xml  = await res.text();
    const m    = xml.match(/<item type="boardgame" id="(\d+)"/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

async function getBggImageUrl(bggId: string): Promise<string | null> {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(`https://boardgamegeek.com/xmlapi2/thing?id=${bggId}`);
      // BGG returns 202 when data is being processed — retry after delay
      if (res.status === 202) {
        await sleep(2500);
        continue;
      }
      const xml   = await res.text();
      const match = xml.match(/<image>\s*([^<]+)\s*<\/image>/);
      if (!match) return null;
      const path  = match[1].trim();
      return path.startsWith("//") ? `https:${path}` : path;
    } catch {
      await sleep(1500);
    }
  }
  return null;
}

async function main() {
  const { data: jeux, error } = await sb
    .from("jeux")
    .select("id, nom, image_url")
    .order("nom");

  if (error || !jeux) {
    console.error("❌ Erreur Supabase :", error?.message ?? "réponse vide");
    process.exit(1);
  }

  const rows = jeux as { id: string; nom: string; image_url: string | null }[];
  console.log(`\n🎲  Récupération images BGG — ${rows.length} jeux\n${"─".repeat(52)}`);

  let updated = 0, skipped = 0, failed = 0;

  for (const jeu of rows) {
    process.stdout.write(`  ${jeu.nom.padEnd(35)} `);

    // Already a BGG image — skip
    if (jeu.image_url?.includes("geekdo-images.com")) {
      console.log("⏭  déjà BGG");
      skipped++;
      continue;
    }

    const bggId = await searchBggId(jeu.nom);
    await sleep(1200);

    if (!bggId) {
      console.log("❌  BGG ID introuvable");
      failed++;
      continue;
    }

    const imageUrl = await getBggImageUrl(bggId);
    await sleep(1200);

    if (!imageUrl) {
      console.log(`❌  image introuvable (BGG #${bggId})`);
      failed++;
      continue;
    }

    const { error: upErr } = await sb
      .from("jeux")
      .update({ image_url: imageUrl })
      .eq("id", jeu.id);

    if (upErr) {
      console.log(`❌  Supabase update : ${upErr.message}`);
      failed++;
      continue;
    }

    console.log(`✅  ...${imageUrl.slice(-45)}`);
    updated++;
  }

  console.log(`\n${"═".repeat(52)}`);
  console.log(`✔  Terminé : ${updated} mis à jour | ${skipped} ignoré(s) | ${failed} échec(s)`);
  console.log();
}

main().catch((err) => {
  console.error("\n❌ Erreur fatale :", err);
  process.exit(1);
});
