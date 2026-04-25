/**
 * scripts/fetch-spotify-playlists.ts
 *
 * Pour chaque jeu sans spotify_playlist_id dans Supabase :
 *   1. Génère des mots-clés de recherche via Claude Haiku
 *   2. Cherche une playlist publique sur Spotify
 *   3. Enregistre l'ID de la première playlist pertinente
 *
 * Run: npm run fetch-spotify
 */

import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

// ── Env ────────────────────────────────────────────────────────────────────

const SUPABASE_URL    = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY     = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SPOTIFY_ID      = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_SECRET  = process.env.SPOTIFY_CLIENT_SECRET;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌  NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquants");
  process.exit(1);
}
if (!SPOTIFY_ID || !SPOTIFY_SECRET) {
  console.error("❌  SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET manquants dans .env.local");
  process.exit(1);
}

// ── Clients ────────────────────────────────────────────────────────────────

const sb     = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
const claude = new Anthropic();

// ── Spotify auth (Client Credentials) ────────────────────────────────────

let spotifyToken = "";
let tokenExpiry  = 0;

async function getSpotifyToken(): Promise<string> {
  if (Date.now() < tokenExpiry) return spotifyToken;

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${SPOTIFY_ID}:${SPOTIFY_SECRET}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) throw new Error(`Spotify auth failed: ${res.status} ${await res.text()}`);
  const data = await res.json() as { access_token: string; expires_in: number };
  spotifyToken = data.access_token;
  tokenExpiry  = Date.now() + (data.expires_in - 60) * 1000;
  return spotifyToken;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Claude: generate search keywords ─────────────────────────────────────

async function generateKeywords(nom: string, categories: string[]): Promise<string> {
  const catStr = categories.length ? categories.join(", ") : "jeu de société";
  const msg = await claude.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 80,
    messages: [{
      role: "user",
      content: `Tu cherches une playlist Spotify d'ambiance musicale pour jouer au jeu de société "${nom}" (catégories : ${catStr}).
Génère une requête de recherche courte et efficace (3-6 mots en anglais ou français) pour trouver une playlist adaptée à l'ambiance de ce jeu.
Réponds UNIQUEMENT avec la requête, sans guillemets ni ponctuation.`,
    }],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text.trim() : nom;
  return text.replace(/['"]/g, "").trim();
}

// ── Spotify: search playlist ──────────────────────────────────────────────

async function searchPlaylist(query: string): Promise<string | null> {
  const token = await getSpotifyToken();
  const url   = `https://api.spotify.com/v1/search?type=playlist&q=${encodeURIComponent(query)}&limit=5&market=FR`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    console.warn(`    ⚠  Spotify search failed: ${res.status}`);
    return null;
  }

  const data = await res.json() as {
    playlists?: {
      items: Array<{
        id: string;
        name: string;
        owner: { display_name: string };
        tracks: { total: number };
        public: boolean | null;
      } | null>;
    };
  };

  const items = (data.playlists?.items ?? []).filter(Boolean) as NonNullable<typeof data.playlists>["items"];

  // Prefer public playlists with at least 10 tracks
  const candidate = items.find((p) => p !== null && p.tracks.total >= 10) ?? items[0] ?? null;

  if (candidate) {
    console.log(`    🎵  "${candidate.name}" (${candidate.tracks.total} titres) by ${candidate.owner.display_name}`);
    return candidate.id;
  }
  return null;
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log("🎵  Fetch Spotify playlists\n");

  // Fetch games without playlist, with their categories
  const { data: jeux, error } = await sb
    .from("jeux")
    .select(`
      id, nom,
      jeux_categories(categories(nom))
    `)
    .is("spotify_playlist_id", null)
    .eq("actif", true)
    .order("nom");

  if (error) { console.error("❌  Supabase:", error.message); process.exit(1); }
  if (!jeux || jeux.length === 0) { console.log("✅  Aucun jeu à traiter."); return; }

  console.log(`📋  ${jeux.length} jeu(x) sans playlist Spotify\n`);

  let updated = 0;
  let skipped = 0;

  for (const jeu of jeux) {
    const row = jeu as unknown as {
      id: string;
      nom: string;
      jeux_categories: { categories: { nom: string } | null }[];
    };

    const categories = (row.jeux_categories ?? [])
      .map((jc) => jc.categories?.nom)
      .filter(Boolean) as string[];

    console.log(`🎲  ${row.nom}${categories.length ? ` [${categories.join(", ")}]` : ""}`);

    try {
      // 1. Generate keywords via Claude
      const query = await generateKeywords(row.nom, categories);
      console.log(`    🔍  Recherche : "${query}"`);

      // 2. Search Spotify
      const playlistId = await searchPlaylist(query);

      if (!playlistId) {
        console.log("    ⏭  Aucune playlist trouvée — ignoré");
        skipped++;
      } else {
        // 3. Save to Supabase
        const { error: upErr } = await sb
          .from("jeux")
          .update({ spotify_playlist_id: playlistId })
          .eq("id", row.id);

        if (upErr) {
          console.warn(`    ⚠  Erreur Supabase: ${upErr.message}`);
          skipped++;
        } else {
          updated++;
        }
      }
    } catch (err) {
      console.warn(`    ⚠  Erreur: ${err instanceof Error ? err.message : String(err)}`);
      skipped++;
    }

    // Rate limit: ~1 req/s toward Spotify + Claude
    await sleep(1200);
    console.log("");
  }

  console.log(`\n✅  Terminé — ${updated} mis à jour, ${skipped} ignorés`);
}

main().catch((err) => {
  console.error("❌  Fatal:", err);
  process.exit(1);
});
