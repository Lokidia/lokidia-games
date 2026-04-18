/**
 * scripts/import-bgg.ts
 *
 * Fetches the top 100 boardgames from BoardGameGeek, upserts them into Supabase,
 * and auto-associates each game with existing Supabase categories.
 *
 * Run: npm run import-bgg
 */

import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { createClient } from "@supabase/supabase-js";

// ─── Supabase client ──────────────────────────────────────────────────────────

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(`
❌  Missing env vars in .env.local:
   NEXT_PUBLIC_SUPABASE_URL      ${SUPABASE_URL  ? "✓" : "✗"}
   SUPABASE_SERVICE_ROLE_KEY     ${SERVICE_KEY   ? "✓" : "✗"}
`);
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

// ─── Config ───────────────────────────────────────────────────────────────────

const RATE_LIMIT_MS  = 2000; // delay between BGG API calls (2s avoids rate limiting)
const BGG_BATCH_SIZE = 20;   // max IDs per thing request

// ─── BGG → Supabase category slug mappings ───────────────────────────────────
// BGG boardgamecategory label → Supabase category slugs (from fix-categories.ts hierarchy)

const BGG_CATEGORY_MAP: Record<string, string[]> = {
  "Strategy":              ["strategie"],
  "Abstract Strategy":     ["strategie"],
  "Family Game":           ["familial"],
  "Children's Game":       ["familial", "pour-enfants"],
  "Party Game":            ["ambiance"],
  "Cooperative Game":      ["cooperatif"],
  "Deduction":             ["enquete"],
  "Adventure":             ["strategie"],
  "Fantasy":               ["strategie"],
  "Science Fiction":       ["science-fiction"],
  "Economic":              ["strategie"],
  "Negotiation":           ["ambiance"],
  "Bluffing":              ["ambiance"],
  "Word Game":             ["ambiance"],
  "Trivia":                ["ambiance"],
  "Horror":                ["enquete"],
  "Card Game":             ["cartes"],
  "Dice":                  ["des"],
  "Medieval":              ["medieval"],
  "Exploration":           ["strategie"],
  "Mythology":             ["strategie"],
  "Animals":               ["familial", "nature"],
  "Pirates":               ["familial"],
  "City Building":         ["strategie"],
  "Political":             ["strategie"],
  "Humor":                 ["ambiance"],
  "Educational":           ["familial"],
  "Wargame":               ["strategie"],
  "Territory Building":    ["strategie"],
  "Ancient":               ["strategie"],
  "Renaissance":           ["strategie"],
  "Trains":                ["strategie"],
  "Nautical":              ["familial"],
  "Racing":                ["familial"],
  "Sports":                ["ambiance"],
  "Murder/Mystery":        ["enquete"],
  "Spies/Secret Agents":   ["enquete"],
  "Miniatures":            ["strategie"],
  "Number":                ["familial"],
  "Math":                  ["familial"],
  "Memory":                ["familial", "pour-enfants"],
  "Aviation / Flight":     ["strategie"],
  "Electronic":            ["familial"],
};

// BGG boardgamemechanic label → Supabase category slugs
const BGG_MECHANIC_MAP: Record<string, string[]> = {
  "Cooperative Game":      ["cooperatif"],
  "Semi-Cooperative":      ["cooperatif"],
  "Social Deduction":      ["enquete"],
  "Hand Management":       ["cartes"],
  "Trick-taking":          ["cartes"],
  "Deck Building":         ["cartes"],
  "Deckbuilding":          ["cartes"],
  "Roll-and-Write":        ["des"],
  "Push Your Luck":        ["des"],
  "Dice Rolling":          ["des"],
  "Solo / Solitaire":      ["solo"],
};

// ─── Utilities ────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function mapComplexite(
  weight: number,
): "Très simple" | "Simple" | "Intermédiaire" | "Complexe" | "Expert" {
  if (weight < 1.5) return "Très simple";
  if (weight < 2.5) return "Simple";
  if (weight < 3.5) return "Intermédiaire";
  if (weight < 4.5) return "Complexe";
  return "Expert";
}

function safeFloat(s: string | undefined, fallback: number): number {
  const v = parseFloat(s ?? "");
  return isNaN(v) ? fallback : v;
}

function safeInt(s: string | undefined, fallback: number): number {
  const v = parseInt(s ?? "");
  return isNaN(v) ? fallback : v;
}

function decodeHtml(s: string): string {
  return s
    .replace(/&#10;/g, " ").replace(/&#9;/g, " ").replace(/&#13;/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&apos;/g, "'")
    .replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface BggGame {
  bggId:       number;
  name:        string;
  description: string;
  year:        number;
  minPlayers:  number;
  maxPlayers:  number;
  minPlaytime: number;
  maxPlaytime: number;
  age:         number;
  weight:      number;
  avgRating:   number;
  imageUrl:    string;
  categories:  string[];
  mechanics:   string[];
  bggRank:     number | null;
}

// ─── Step 1: Top-100 BGG game IDs (hardcoded from BGG all-time rankings) ──────
// BGG XML API has no rank-browsing endpoint; HTML scraping returns 403.
// IDs sourced from BGG top rankings as of 2024-2025.

const TOP_100_BGG_IDS: number[] = [
  // #1–20 (provided by user)
  174430, // Gloomhaven
  30549,  // Pandemic
  13,     // Catan
  167791, // Terraforming Mars
  230802, // Azul
  68448,  // 7 Wonders
  822,    // Carcassonne
  9209,   // Ticket to Ride
  266192, // Wingspan
  237182, // Root
  169786, // Scythe
  170042, // Blood Rage
  178900, // Codenames
  148228, // Splendor
  98778,  // Hanabi
  39856,  // Dixit
  129622, // Love Letter
  160771, // Sheriff of Nottingham
  224517, // Brass: Birmingham
  233867, // Welcome To...

  // #21–40 — classic strategy & euro
  36218,  // Dominion
  3076,   // Puerto Rico
  2651,   // Power Grid
  31260,  // Agricola
  161936, // Pandemic Legacy: Season 1
  12333,  // Twilight Struggle
  182028, // Through the Ages: A New Story of Civilization
  162886, // Spirit Island
  193738, // Great Western Trail
  183394, // Viticulture: Essential Edition
  199792, // Everdell
  173346, // 7 Wonders Duel
  84876,  // The Castles of Burgundy
  111736, // Concordia
  148949, // Istanbul
  163412, // Patchwork
  96848,  // Mage Knight Board Game
  121921, // Robinson Crusoe: Adventures on the Cursed Island
  102794, // Caverna: The Cave Farmers
  177736, // A Feast for Odin

  // #41–60 — heavy euro & thematic
  220308, // Gaia Project
  35677,  // Le Havre
  28720,  // Brass: Lancashire
  120677, // Terra Mystica
  72125,  // Eclipse: Second Dawn for the Galaxy
  233078, // Twilight Imperium: Fourth Edition
  187645, // Star Wars: Rebellion
  200680, // Arkham Horror: The Card Game
  146021, // Eldritch Horror
  39463,  // Cosmic Encounter
  478,    // Citadels
  65244,  // Forbidden Island
  199561, // Sagrada
  204583, // Kingdomino
  201808, // Clank! A Deck-Building Adventure
  92415,  // Skull
  131357, // Coup
  172225, // Exploding Kittens
  236457, // Architects of the West Kingdom
  181304, // Mysterium

  // #61–80 — modern classics & social
  110327, // Lords of Waterdeep
  150376, // Dead of Winter: A Crossroads Game
  156129, // Deception: Murder in Hong Kong
  199478, // Flamme Rouge
  147949, // One Night Ultimate Werewolf
  192291, // Sushi Go Party!
  2655,   // Hive
  54043,  // Jaipur
  155123, // Inis
  209418, // Century: Spice Road
  205059, // Mansions of Madness: Second Edition
  123260, // Suburbia
  122522, // Smash Up
  244521, // The Quacks of Quedlinburg
  262712, // Dune: Imperium
  316554, // Ark Nova
  295947, // Cascadia
  276025, // Maracaibo
  104162, // Descent: Journeys in the Dark (2nd Ed)
  164153, // Star Wars: Imperial Assault

  // #81–100 — variety & depth
  136888, // Forbidden Desert
  104006, // Village
  155049, // The Voyages of Marco Polo
  73439,  // Troyes
  10547,  // Betrayal at House on the Hill
  115746, // War of the Ring (2nd Ed)
  160477, // Onitama
  15987,  // Arkham Horror (2nd Ed)
  14996,  // Ticket to Ride: Europe
  14205,  // Sherlock Holmes Consulting Detective
  194655, // Santorini
  221107, // Pandemic Legacy: Season 2
  37111,  // Battlestar Galactica: The Board Game
  9674,   // Ingenious
  63888,  // Innovation
  42,     // Tigris & Euphrates
  185343, // Anachrony
  271320, // Sleeping Gods
  285774, // Lost Ruins of Arnak
  312484, // Dune: A Game of Conquest and Diplomacy
];

// De-duplicate while preserving order
function getTopGameIds(): number[] {
  return Array.from(new Set(TOP_100_BGG_IDS));
}

// ─── Step 2: Fetch game details from BGG XML API ──────────────────────────────

function parseThingXml(xml: string): BggGame[] {
  const games: BggGame[] = [];
  const itemRe = /<item[^>]+type="boardgame"[^>]+id="(\d+)"[^>]*>([\s\S]*?)<\/item>/g;
  let itemM: RegExpExecArray | null;

  while ((itemM = itemRe.exec(xml)) !== null) {
    const bggId = parseInt(itemM[1]);
    const block  = itemM[2];

    const nameMatch = block.match(/<name type="primary"[^>]+value="([^"]+)"/);
    if (!nameMatch) continue;
    const name = decodeHtml(nameMatch[1]);

    const descRaw   = block.match(/<description>([\s\S]*?)<\/description>/)?.[1] ?? "";
    const description = decodeHtml(descRaw).slice(0, 2000);

    const year        = safeInt(block.match(/<yearpublished value="(\d+)"/)?.[1], 2000);
    const minPlayers  = Math.max(1, safeInt(block.match(/<minplayers value="(\d+)"/)?.[1], 1));
    const maxPlayers  = Math.max(minPlayers, safeInt(block.match(/<maxplayers value="(\d+)"/)?.[1], minPlayers));
    const minPlaytime = safeInt(block.match(/<minplaytime value="(\d+)"/)?.[1], 0);
    const maxPlaytime = Math.max(minPlaytime, safeInt(block.match(/<maxplaytime value="(\d+)"/)?.[1], minPlaytime));
    const age         = safeInt(block.match(/<minage value="(\d+)"/)?.[1], 0);
    const avgRating   = safeFloat(block.match(/<average value="([^"]+)"/)?.[1], 0);
    const weight      = safeFloat(block.match(/<averageweight value="([^"]+)"/)?.[1], 0);

    const imageRaw = block.match(/<image>([^<]*)<\/image>/)?.[1]?.trim() ?? "";
    const imageUrl = imageRaw
      ? imageRaw.startsWith("//") ? `https:${imageRaw}` : imageRaw
      : "";

    const rankMatch = block.match(/<rank[^>]+name="boardgame"[^>]+value="(\d+)"/);
    const bggRank   = rankMatch ? safeInt(rankMatch[1], 0) || null : null;

    const categories: string[] = [];
    const catRe = /<link type="boardgamecategory"[^>]+value="([^"]+)"/g;
    let cm: RegExpExecArray | null;
    while ((cm = catRe.exec(block)) !== null) {
      categories.push(decodeHtml(cm[1]));
    }

    const mechanics: string[] = [];
    const mechRe = /<link type="boardgamemechanic"[^>]+value="([^"]+)"/g;
    let mm: RegExpExecArray | null;
    while ((mm = mechRe.exec(block)) !== null) {
      mechanics.push(decodeHtml(mm[1]));
    }

    games.push({
      bggId, name, description, year,
      minPlayers, maxPlayers, minPlaytime, maxPlaytime,
      age, weight, avgRating, imageUrl, categories, mechanics, bggRank,
    });
  }

  return games;
}

// Full browser User-Agent — BGG rejects minimal/bot-style agents
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
};

// ─── Source A: api.geekdo.com JSON API ───────────────────────────────────────
// Public endpoint, no auth required. Returns richer JSON than the XML API.

// Confirmed geekdo response shape (from raw --test output):
//   item.name                                  → string  "Gloomhaven"
//   item.yearpublished                         → number
//   item.minplayers / maxplayers               → number
//   item.minplaytime / maxplaytime             → number
//   item.minage                                → number
//   item.description                           → string (HTML entities)
//   item.links.boardgamecategory               → { id, name }[]
//   item.links.boardgamemechanic               → { id, name }[]
//   item.images.mediaid (or .original/.medium) → "//cf.geekdo-images.com/…"
//   item.image                                 → same, fallback
//   item.stats.average + item.stats.avgweight  → numbers
//   item.ratings.average + .averageweight      → alternative location
//   item.rank                                  → number | "Not Ranked"

function parseGeekdoItem(json: unknown, id: number): BggGame | null {
  if (!json || typeof json !== "object") return null;
  const obj = json as Record<string, unknown>;

  // Unwrap { item: {...} } envelope
  const raw = (obj["item"] ?? obj) as Record<string, unknown>;
  if (!raw || typeof raw !== "object") return null;

  // ── Name: plain string ───────────────────────────────────────────────────
  const name = typeof raw["name"] === "string" ? raw["name"].trim() : "";
  if (!name) return null;

  // ── Scalars ──────────────────────────────────────────────────────────────
  const description = decodeHtml(String(raw["description"] ?? "")).slice(0, 2000);
  const year        = safeInt(String(raw["yearpublished"] ?? ""), 2000);
  const minPlayers  = Math.max(1, safeInt(String(raw["minplayers"] ?? ""), 1));
  const maxPlayers  = Math.max(minPlayers, safeInt(String(raw["maxplayers"] ?? ""), minPlayers));
  const minPlaytime = safeInt(String(raw["minplaytime"] ?? ""), 0);
  const maxPlaytime = Math.max(minPlaytime, safeInt(String(raw["maxplaytime"] ?? ""), minPlaytime));
  const age         = safeInt(String(raw["minage"] ?? ""), 0);
  const bggRank     = safeInt(String(raw["rank"] ?? ""), 0) || null;

  // ── Rating + weight: item.stats or item.ratings ──────────────────────────
  type NumBlock = Record<string, unknown>;
  const rBlock  = (raw["stats"] ?? raw["ratings"] ?? {}) as NumBlock;
  const avgRating = safeFloat(String(rBlock["average"]    ?? rBlock["baverage"]      ?? ""), 0);
  const weight    = safeFloat(String(rBlock["avgweight"]  ?? rBlock["averageweight"] ?? ""), 0);

  // ── Image: item.images.{mediaid|original|medium} or item.image ───────────
  type ImgBlock = Record<string, unknown>;
  const imgBlock = raw["images"] as ImgBlock | undefined;
  const rawImg   = String(
    imgBlock?.["mediaid"] ?? imgBlock?.["original"] ?? imgBlock?.["medium"] ??
    imgBlock?.["small"]   ?? raw["image"] ?? raw["thumbnail"] ?? "",
  );
  const imageUrl = rawImg.startsWith("//") ? `https:${rawImg}` : rawImg;

  // ── Links: item.links.boardgamecategory / boardgamemechanic ─────────────
  // Each entry is { id: number, name: string }
  type LinkEntry = { name?: string };
  type LinksBlock = Record<string, LinkEntry[]>;
  const links = (raw["links"] ?? {}) as LinksBlock;
  const categories = (links["boardgamecategory"] ?? []).map(e => e.name ?? "").filter(Boolean);
  const mechanics  = (links["boardgamemechanic"]  ?? []).map(e => e.name ?? "").filter(Boolean);

  return {
    bggId: id, name, description, year,
    minPlayers, maxPlayers, minPlaytime, maxPlaytime,
    age, weight, avgRating, imageUrl, categories, mechanics, bggRank,
  };
}

async function fetchViaGeekdo(id: number): Promise<BggGame | null> {
  const url = `https://api.geekdo.com/api/geekitems?objectid=${id}&objecttype=thing`;
  try {
    const res = await fetch(url, {
      headers: { ...HEADERS, "Accept": "application/json" },
    });
    if (!res.ok) {
      console.warn(`    geekdo ${id}: HTTP ${res.status}`);
      return null;
    }
    const json = await res.json() as unknown;
    return parseGeekdoItem(json, id);
  } catch (err) {
    console.warn(`    geekdo ${id}: ${(err as Error).message}`);
    return null;
  }
}

// ─── Source B: BGG XML API (no auth, 2 s delay) ───────────────────────────────

async function fetchViaXmlBatch(ids: number[]): Promise<BggGame[]> {
  const url = `https://boardgamegeek.com/xmlapi2/thing?id=${ids.join(",")}&stats=1`;

  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url, {
      headers: { ...HEADERS, "Accept": "application/xml, text/xml, */*" },
    });

    if (res.status === 202) {
      console.log("      BGG queued (202), retrying in 5s...");
      await sleep(5000);
      continue;
    }

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.warn(`      XML API ${res.status}: ${body.slice(0, 150)}`);
      return [];
    }

    return parseThingXml(await res.text());
  }

  console.error("      Exhausted XML API retries");
  return [];
}

// ─── Combined fetch: geekdo first, XML fallback ───────────────────────────────
// One game at a time via geekdo (no batching needed — JSON is light).
// Falls back to a 20-ID XML batch if geekdo fails for the whole group.

async function fetchGamesBatch(ids: number[]): Promise<BggGame[]> {
  const results: BggGame[] = [];
  const xmlFallbackIds: number[] = [];

  for (const id of ids) {
    const game = await fetchViaGeekdo(id);
    if (game) {
      results.push(game);
    } else {
      xmlFallbackIds.push(id);
    }
    await sleep(RATE_LIMIT_MS);
  }

  // Batch-fetch any IDs that geekdo couldn't deliver via XML API
  if (xmlFallbackIds.length > 0) {
    console.log(`      → XML fallback for ${xmlFallbackIds.length} ID(s)`);
    const xmlGames = await fetchViaXmlBatch(xmlFallbackIds);
    results.push(...xmlGames);
    if (xmlFallbackIds.length < ids.length) await sleep(RATE_LIMIT_MS);
  }

  return results;
}

// ─── Step 3: Upsert games + associate categories ──────────────────────────────

async function importGames(
  games: BggGame[],
  supabaseCategories: { id: string; slug: string }[],
): Promise<{ ok: number; fail: number }> {
  let ok = 0, fail = 0;

  for (const game of games) {
    const slug = slugify(game.name);
    if (!slug) {
      console.warn(`  Skipping "${game.name}" — empty slug`);
      fail++;
      continue;
    }

    process.stdout.write(`  [#${game.bggRank ?? "?"}] ${game.name} ... `);

    const { data: upserted, error } = await sb
      .from("jeux")
      .upsert(
        {
          slug,
          nom:         game.name,
          annee:       game.year || 2000,
          description: game.description || `Jeu de société ${game.name}.`,
          joueurs_min: game.minPlayers,
          joueurs_max: game.maxPlayers,
          duree_min:   game.minPlaytime,
          duree_max:   game.maxPlaytime,
          age_min:     game.age,
          complexite:  mapComplexite(game.weight),
          note:        Math.round(game.avgRating * 10) / 10,
          mecaniques:  game.mechanics.slice(0, 10),
          regles:      [] as string[],
          image_url:   game.imageUrl || null,
        },
        { onConflict: "slug" },
      )
      .select("id")
      .single();

    if (error || !upserted) {
      console.log(`ERROR: ${error?.message ?? "no data"}`);
      fail++;
      continue;
    }

    const jeuId = upserted.id as string;

    // Resolve which Supabase category IDs to associate
    const catSlugs = new Set<string>();
    for (const bggCat of game.categories) {
      for (const s of BGG_CATEGORY_MAP[bggCat] ?? []) catSlugs.add(s);
    }
    for (const bggMech of game.mechanics) {
      for (const s of BGG_MECHANIC_MAP[bggMech] ?? []) catSlugs.add(s);
    }

    const catIds = Array.from(catSlugs)
      .map(s => supabaseCategories.find(c => c.slug === s)?.id)
      .filter((id): id is string => Boolean(id));

    if (catIds.length > 0) {
      await sb
        .from("jeux_categories")
        .upsert(
          catIds.map(catId => ({ jeu_id: jeuId, categorie_id: catId })),
          { onConflict: "jeu_id,categorie_id", ignoreDuplicates: true },
        );
    }

    const catList = Array.from(catSlugs).join(", ") || "none";
    console.log(`OK (${catIds.length} cats: ${catList})`);
    ok++;
  }

  return { ok, fail };
}

// ─── Test mode ────────────────────────────────────────────────────────────────
// Run: npm run import-bgg -- --test
// Fetches ID 174430 (Gloomhaven) and prints the raw BGG XML response.

async function runTest() {
  const TEST_ID = 174430; // Gloomhaven

  // ── A: geekdo JSON API ──
  console.log(`\n── A: geekdo JSON API ──`);
  const geekdoUrl = `https://api.geekdo.com/api/geekitems?objectid=${TEST_ID}&objecttype=thing`;
  console.log(`GET ${geekdoUrl}`);
  try {
    const res = await fetch(geekdoUrl, { headers: { ...HEADERS, "Accept": "application/json" } });
    console.log(`HTTP ${res.status} ${res.statusText}`);
    const body = await res.text();
    console.log(`Raw response (first 2000 chars):\n${"─".repeat(60)}`);
    console.log(body.slice(0, 2000));
    console.log("─".repeat(60));
    if (res.ok) {
      const game = parseGeekdoItem(JSON.parse(body) as unknown, TEST_ID);
      console.log(game ? `\n✓ Parsed:\n${JSON.stringify(game, null, 2)}` : "\n✗ parseGeekdoItem returned null");
    }
  } catch (err) {
    console.error(`geekdo fetch failed: ${(err as Error).message}`);
  }

  // ── B: BGG XML API ──
  console.log(`\n\n── B: BGG XML API ──`);
  const xmlUrl = `https://boardgamegeek.com/xmlapi2/thing?id=${TEST_ID}&stats=1`;
  console.log(`GET ${xmlUrl}`);
  try {
    const res = await fetch(xmlUrl, { headers: { ...HEADERS, "Accept": "application/xml, text/xml, */*" } });
    console.log(`HTTP ${res.status} ${res.statusText}`);
    const body = await res.text();
    console.log(`Raw response (first 2000 chars):\n${"─".repeat(60)}`);
    console.log(body.slice(0, 2000));
    console.log("─".repeat(60));
    if (res.ok) {
      const games = parseThingXml(body);
      console.log(games.length > 0 ? `\n✓ Parsed:\n${JSON.stringify(games[0], null, 2)}` : "\n✗ parseThingXml returned 0 games");
    }
  } catch (err) {
    console.error(`XML API fetch failed: ${(err as Error).message}`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // --test: verify BGG connectivity + XML parsing before a full import
  if (process.argv.includes("--test")) {
    await runTest();
    return;
  }

  console.log("═══════════════════════════════════════════════");
  console.log("  BGG Import — Lokidia Games");
  console.log("═══════════════════════════════════════════════\n");

  // Load existing Supabase categories
  const { data: cats, error: catErr } = await sb
    .from("categories")
    .select("id, slug");
  if (catErr) {
    console.error("Cannot load Supabase categories:", catErr.message);
    process.exit(1);
  }
  const supabaseCategories = (cats ?? []) as { id: string; slug: string }[];
  console.log(`Loaded ${supabaseCategories.length} Supabase categories`);
  console.log(`Known slugs: ${supabaseCategories.map(c => c.slug).join(", ")}\n`);

  // Step 1 — Hardcoded top-100 BGG IDs (de-duplicated)
  const gameIds = getTopGameIds();
  console.log(`\n→ ${gameIds.length} BGG game IDs loaded\n`);

  if (gameIds.length === 0) {
    console.error("No game IDs found. Aborting.");
    process.exit(1);
  }

  // Step 2 — Fetch details in batches of 20
  const allGames: BggGame[] = [];
  const totalBatches = Math.ceil(gameIds.length / BGG_BATCH_SIZE);

  console.log(`Fetching details (${totalBatches} batches × ${BGG_BATCH_SIZE} games)\n`);

  for (let i = 0; i < gameIds.length; i += BGG_BATCH_SIZE) {
    const batch    = gameIds.slice(i, i + BGG_BATCH_SIZE);
    const batchNum = Math.floor(i / BGG_BATCH_SIZE) + 1;
    process.stdout.write(`Batch ${batchNum}/${totalBatches} ... `);

    const games = await fetchGamesBatch(batch);
    allGames.push(...games);
    console.log(`${games.length} games parsed`);

    if (i + BGG_BATCH_SIZE < gameIds.length) await sleep(RATE_LIMIT_MS);
  }

  console.log(`\nTotal games fetched from BGG: ${allGames.length}`);

  // Sort by BGG rank ascending (unranked go last)
  allGames.sort((a, b) => {
    if (a.bggRank === null) return 1;
    if (b.bggRank === null) return -1;
    return a.bggRank - b.bggRank;
  });

  // Step 3 — Upsert into Supabase + categorize
  console.log("\n─── Importing into Supabase ───\n");
  const { ok, fail } = await importGames(allGames, supabaseCategories);

  console.log(`
═══════════════════════════════════════════════
  Done
  ✓ ${ok} games imported / updated
  ${fail > 0 ? `✗ ${fail} errors` : "✗ 0 errors"}
═══════════════════════════════════════════════
`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
