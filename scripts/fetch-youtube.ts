/**
 * scripts/fetch-youtube.ts
 *
 * Pour chaque jeu dans Supabase sans youtube_id :
 *   1. Cherche sur YouTube Data API v3 plusieurs requêtes
 *   2. Sélectionne la meilleure vidéo (≥1000 vues en priorité)
 *   3. Sauvegarde youtube_id dans jeux.youtube_id
 *
 * Run: npm run fetch-youtube
 *
 * Variables d'environnement requises :
 *   YOUTUBE_API_KEY — clé API YouTube Data v3 (Google Cloud Console)
 */

import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL   = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY    = process.env.SUPABASE_SERVICE_ROLE_KEY;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌  Variables Supabase manquantes"); process.exit(1);
}
if (!YOUTUBE_API_KEY) {
  console.error("❌  YOUTUBE_API_KEY manquant dans .env.local"); process.exit(1);
}

const sb = createClient(SUPABASE_URL!, SERVICE_KEY!, { auth: { persistSession: false } });

const RATE_MS = 1200;
function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

interface YTSearchItem {
  id: { videoId: string };
  snippet: { title: string };
}
interface YTSearchResponse {
  items?: YTSearchItem[];
  error?: { message: string; errors?: Array<{ reason: string }> };
}
interface YTStatsItem {
  id: string;
  statistics: { viewCount: string };
}
interface YTStatsResponse {
  items?: YTStatsItem[];
}

async function searchVideos(nom: string): Promise<string | null> {
  const queries = [
    `${nom} jeu de société règles présentation`,
    `${nom} jeu de société comment jouer`,
    `${nom} board game review`,
  ];

  for (const q of queries) {
    const params = new URLSearchParams({
      part: "snippet",
      q,
      type: "video",
      relevanceLanguage: "fr",
      maxResults: "5",
      key: YOUTUBE_API_KEY!,
    });

    console.log(`    🔎  "${q}"`);

    try {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
      const data = await res.json() as YTSearchResponse;

      if (data.error) {
        console.error(`    ❌  YouTube API: ${data.error.message}`);
        return null;
      }

      const items = data.items ?? [];
      if (!items.length) continue;

      // Fetch view counts
      const ids = items.map((i) => i.id.videoId).join(",");
      const statsRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${ids}&key=${YOUTUBE_API_KEY}`
      );
      const statsData = statsRes.ok ? (await statsRes.json() as YTStatsResponse) : null;
      const views: Record<string, number> = {};
      for (const s of statsData?.items ?? []) {
        views[s.id] = parseInt(s.statistics.viewCount ?? "0", 10);
      }

      // Prefer ≥1000 views, else take first
      const sorted = [...items].sort((a, b) => (views[b.id.videoId] ?? 0) - (views[a.id.videoId] ?? 0));
      const best = sorted.find((v) => (views[v.id.videoId] ?? 0) >= 1000) ?? sorted[0];

      if (best) {
        const v = best.id.videoId;
        const viewCount = views[v] ?? 0;
        console.log(`    ✅  ${v} — "${best.snippet.title}" (${viewCount.toLocaleString("fr")} vues)`);
        return v;
      }
    } catch (e) {
      console.warn(`    ⚠  Erreur requête : ${e instanceof Error ? e.message : String(e)}`);
      continue;
    }

    await sleep(RATE_MS);
  }

  return null;
}

async function main() {
  console.log("▶️   Fetch YouTube pour les jeux Supabase\n");

  const { data: jeux, error } = await sb
    .from("jeux")
    .select("id, nom")
    .is("youtube_id", null)
    .eq("actif", true)
    .order("nom");

  if (error) { console.error("❌  Supabase:", error.message); process.exit(1); }
  if (!jeux?.length) { console.log("✅  Tous les jeux ont déjà une vidéo YouTube."); return; }

  console.log(`📋  ${jeux.length} jeu(x) sans YouTube\n`);

  let found = 0;
  let skipped = 0;

  for (const jeu of jeux) {
    const row = jeu as unknown as { id: string; nom: string };
    console.log(`🎲  ${row.nom}`);

    const youtubeId = await searchVideos(row.nom);

    if (youtubeId) {
      const { error: upErr } = await sb.from("jeux").update({ youtube_id: youtubeId }).eq("id", row.id);
      if (upErr) { console.warn(`    ⚠  Supabase: ${upErr.message}`); skipped++; }
      else found++;
    } else {
      console.log("    ⏭  Aucune vidéo trouvée — ignoré");
      skipped++;
    }

    console.log("");
    await sleep(RATE_MS);
  }

  console.log(`\n✅  Terminé — ${found} vidéos trouvées, ${skipped} ignorées`);
}

main().catch((err) => { console.error("❌", err); process.exit(1); });
