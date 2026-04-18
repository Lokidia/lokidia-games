/**
 * scripts/clean-and-translate.ts
 *
 * Three-phase post-import cleanup for the jeux table.
 *
 *   Phase 1 — HTML entity cleanup in description fields
 *   Phase 2 — Duplicate detection (by normalised name), keep most complete row
 *   Phase 3 — French translation of description + mecaniques via Claude Haiku
 *
 * Run all phases:        npm run clean-and-translate
 * Run a single phase:    npm run clean-and-translate -- --phase=2
 */

import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

// ─── Clients ──────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌  NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquants");
  process.exit(1);
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("❌  ANTHROPIC_API_KEY manquant");
  process.exit(1);
}

const sb        = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const TRANSLATE_BATCH = 5;
const MODEL           = process.env.ANTHROPIC_SEO_MODEL ?? "claude-haiku-4-5-20251001";

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// ─── HTML entity map ──────────────────────────────────────────────────────────

const NAMED_ENTITIES: Record<string, string> = {
  "&ldquo;":  "\u201C",   // "
  "&rdquo;":  "\u201D",   // "
  "&lsquo;":  "\u2018",   // '
  "&rsquo;":  "\u2019",   // '
  "&sbquo;":  "\u201A",   // ‚
  "&bdquo;":  "\u201E",   // „
  "&amp;":    "&",
  "&lt;":     "<",
  "&gt;":     ">",
  "&quot;":   '"',
  "&apos;":   "'",
  "&nbsp;":   " ",
  "&ndash;":  "\u2013",   // –
  "&mdash;":  "\u2014",   // —
  "&hellip;": "\u2026",   // …
  "&bull;":   "\u2022",   // •
  "&middot;": "\u00B7",   // ·
  "&copy;":   "\u00A9",   // ©
  "&reg;":    "\u00AE",   // ®
  "&trade;":  "\u2122",   // ™
  "&laquo;":  "\u00AB",   // «
  "&raquo;":  "\u00BB",   // »
  "&eacute;": "é",
  "&egrave;": "è",
  "&ecirc;":  "ê",
  "&agrave;": "à",
  "&ugrave;": "ù",
  "&ocirc;":  "ô",
  "&ccedil;": "ç",
  "&#10;":    " ",
  "&#9;":     " ",
  "&#13;":    "",
  "&#039;":   "'",
  "&#34;":    '"',
};

function cleanHtml(text: string): string {
  if (!text) return "";
  let s = text;

  // Named entities
  for (const [ent, ch] of Object.entries(NAMED_ENTITIES)) {
    s = s.split(ent).join(ch);
  }
  // Decimal numeric: &#NNN;
  s = s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)));
  // Hex numeric: &#xNNN;
  s = s.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
  // Strip any residual HTML tags
  s = s.replace(/<[^>]+>/g, " ");
  // Collapse multiple spaces / odd whitespace
  s = s.replace(/[ \t]{2,}/g, " ").replace(/(\r?\n){3,}/g, "\n\n").trim();

  return s;
}

// ─── Language detection ───────────────────────────────────────────────────────

function likelyEnglish(text: string): boolean {
  if (!text || text.length < 30) return false;
  const lo  = text.toLowerCase();
  // Words that are common in English BGG descriptions but rare in French
  const markers = [" the ", " players ", " each player", " their ", " you must ", " your ", " game ", " player "];
  return markers.filter(m => lo.includes(m)).length >= 2;
}

function hasEnglishMechanics(mecaniques: string[]): boolean {
  // BGG mechanic names are always English ASCII — French ones would contain accents
  return mecaniques.some(m => /^[A-Za-z /:'-]+$/.test(m) && m.length > 3);
}

// ─── Normalise for duplicate detection ───────────────────────────────────────

function normaliseName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

// ─── Completeness score (higher = keep this one) ─────────────────────────────

type JeuRow = {
  id:          string;
  slug:        string;
  nom:         string;
  description: string;
  image_url:   string | null;
  mecaniques:  string[];
  note:        number;
  annee:       number;
};

function score(g: JeuRow): number {
  let s = 0;
  if (g.image_url && g.image_url.length > 4) s += 30;
  if (g.note > 0)                            s += 20;
  if (g.annee > 1900)                        s += 10;
  s += Math.min(g.description?.length ?? 0, 2000) / 100;
  s += (g.mecaniques?.length ?? 0) * 2;
  return s;
}

// ═════════════════════════════════════════════════════════════════════════════
// Phase 1 — HTML entity cleanup
// ═════════════════════════════════════════════════════════════════════════════

async function phase1HtmlCleanup(): Promise<void> {
  console.log("\n━━━ Phase 1 : nettoyage HTML ━━━\n");

  const { data, error } = await sb.from("jeux").select("id, description");
  if (error || !data) { console.error(error); return; }

  const dirty = data.filter(g => {
    const cleaned = cleanHtml(g.description ?? "");
    return cleaned !== (g.description ?? "");
  });

  console.log(`${dirty.length} jeux nécessitent un nettoyage (${data.length - dirty.length} déjà propres)\n`);

  let done = 0;
  // Update 20 at a time
  for (let i = 0; i < dirty.length; i += 20) {
    const chunk = dirty.slice(i, i + 20);
    await Promise.all(
      chunk.map(g =>
        sb.from("jeux")
          .update({ description: cleanHtml(g.description ?? "") })
          .eq("id", g.id),
      ),
    );
    done += chunk.length;
    process.stdout.write(`  ${done}/${dirty.length} mis à jour\r`);
  }

  console.log(`\n✓ ${done} jeux nettoyés`);
}

// ═════════════════════════════════════════════════════════════════════════════
// Phase 2 — Duplicate detection & removal
// ═════════════════════════════════════════════════════════════════════════════

async function phase2Deduplication(): Promise<void> {
  console.log("\n━━━ Phase 2 : détection des doublons ━━━\n");

  const { data, error } = await sb
    .from("jeux")
    .select("id, slug, nom, description, image_url, mecaniques, note, annee");

  if (error || !data) { console.error(error); return; }

  // Group by normalised name
  const groups = new Map<string, JeuRow[]>();
  for (const g of data as JeuRow[]) {
    const key = normaliseName(g.nom ?? "");
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(g);
  }

  const dupes = [...groups.values()].filter(g => g.length > 1);

  if (dupes.length === 0) {
    console.log("✓ Aucun doublon détecté");
    return;
  }

  console.log(`${dupes.length} groupe(s) de doublons trouvé(s) :\n`);

  let deleted = 0;

  for (const group of dupes) {
    // Sort descending by completeness score
    group.sort((a, b) => score(b) - score(a));
    const keep   = group[0];
    const remove = group.slice(1);

    console.log(`  "${keep.nom}" — ${group.length} exemplaires`);
    console.log(`    ✓ Garde  : ${keep.slug}  (score ${score(keep).toFixed(1)})`);

    for (const g of remove) {
      console.log(`    ✗ Supprime : ${g.slug}  (score ${score(g).toFixed(1)})`);
      // jeux_prix + jeux_categories have ON DELETE CASCADE — one delete suffices
      const { error: delErr } = await sb.from("jeux").delete().eq("id", g.id);
      if (delErr) {
        console.error(`      Erreur : ${delErr.message}`);
      } else {
        deleted++;
      }
    }
  }

  console.log(`\n✓ ${deleted} doublon(s) supprimé(s)`);
}

// ═════════════════════════════════════════════════════════════════════════════
// Phase 3 — French translation via Claude
// ═════════════════════════════════════════════════════════════════════════════

interface TransInput  { id: string; nom: string; description: string; mecaniques: string[] }
interface TransOutput { id: string; description: string; mecaniques: string[] }

const MECHANICS_GLOSSARY = `
"Deck Building"→"Construction de deck"
"Worker Placement"→"Placement d'ouvriers"
"Area Control"→"Contrôle de territoire"
"Hand Management"→"Gestion de main"
"Tile Placement"→"Placement de tuiles"
"Cooperative Game"→"Jeu coopératif"
"Semi-Cooperative"→"Semi-coopératif"
"Social Deduction"→"Déduction sociale"
"Roll-and-Write"→"Lancer-écrire"
"Push Your Luck"→"Tenter sa chance"
"Engine Building"→"Construction de moteur"
"Drafting"→"Draft"
"Set Collection"→"Collection de séries"
"Auction/Bidding"→"Enchères"
"Variable Player Powers"→"Pouvoirs asymétriques"
"Action Points"→"Points d'action"
"Dice Rolling"→"Lancer de dés"
"Area Movement"→"Déplacement par zone"
"Network and Route Building"→"Construction de réseau"
"Modular Board"→"Plateau modulaire"
"Grid Movement"→"Déplacement sur grille"
"Card Drafting"→"Draft de cartes"
"Trick-taking"→"Plis"
"Pick-up and Deliver"→"Ramasser et livrer"
"Resource Management"→"Gestion des ressources"
"Trading"→"Commerce"
"Tech Trees / Tech Tracks"→"Arbres technologiques"
"Point to Point Movement"→"Déplacement point à point"
"Simultaneous Action Selection"→"Sélection simultanée d'actions"
"Voting"→"Vote"`.trim();

async function translateBatch(batch: TransInput[]): Promise<TransOutput[]> {
  const payload = batch.map(g => ({
    id:          g.id,
    nom:         g.nom,
    description: g.description.slice(0, 1400),
    mecaniques:  g.mecaniques,
  }));

  const prompt = `Tu es expert en jeux de société. Traduis en français les données ci-dessous.

Retourne UNIQUEMENT un tableau JSON valide, sans markdown ni explication.
Chaque objet doit avoir exactement : id, description, mecaniques.

Règles :
• description : traduction fluide et naturelle ; conserve les noms propres, noms de jeux et lieux
• mecaniques : utilise les termes français standards (glossaire ci-dessous) ; si une mécanique est inconnue, traduis librement
• Ne modifie jamais le champ id

Glossaire mécaniques (EN→FR) :
${MECHANICS_GLOSSARY}

Données :
${JSON.stringify(payload, null, 2)}`;

  const msg = await anthropic.messages.create({
    model:      MODEL,
    max_tokens: 4096,
    messages:   [{ role: "user", content: prompt }],
  });

  const raw = (msg.content[0] as { type: string; text: string }).text.trim();

  // Extract JSON array (Claude sometimes wraps it in markdown)
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error(`Réponse Claude invalide (pas de tableau JSON) : ${raw.slice(0, 300)}`);
  }

  const parsed = JSON.parse(jsonMatch[0]) as TransOutput[];

  // Validate — ensure we have all ids back
  const inputIds  = new Set(batch.map(g => g.id));
  const outputIds = new Set(parsed.map(g => g.id));
  for (const id of inputIds) {
    if (!outputIds.has(id)) throw new Error(`id manquant dans la réponse : ${id}`);
  }

  return parsed;
}

async function phase3Translation(): Promise<void> {
  console.log("\n━━━ Phase 3 : traduction en français ━━━\n");

  const { data, error } = await sb
    .from("jeux")
    .select("id, nom, description, mecaniques");

  if (error || !data) { console.error(error); return; }

  type Row = { id: string; nom: string; description: string; mecaniques: string[] };

  const toTranslate = (data as Row[]).filter(
    g => likelyEnglish(g.description ?? "") || hasEnglishMechanics(g.mecaniques ?? []),
  );

  console.log(`${toTranslate.length} jeux à traduire sur ${data.length}\n`);

  if (toTranslate.length === 0) {
    console.log("✓ Tous les jeux semblent déjà en français");
    return;
  }

  const totalBatches = Math.ceil(toTranslate.length / TRANSLATE_BATCH);
  let done = 0, errs = 0;

  for (let i = 0; i < toTranslate.length; i += TRANSLATE_BATCH) {
    const batch    = toTranslate.slice(i, i + TRANSLATE_BATCH);
    const batchNum = Math.floor(i / TRANSLATE_BATCH) + 1;
    const names    = batch.map(g => g.nom).join(", ");

    process.stdout.write(`  [${batchNum}/${totalBatches}] ${names} ... `);

    try {
      const translated = await translateBatch(batch);

      await Promise.all(
        translated.map(t =>
          sb.from("jeux")
            .update({ description: t.description, mecaniques: t.mecaniques })
            .eq("id", t.id),
        ),
      );

      console.log("✓");
      done += batch.length;
    } catch (err) {
      console.error(`\n    ✗ Erreur : ${(err as Error).message}`);
      errs++;
    }

    // Small pause between batches to stay within Claude rate limits
    if (i + TRANSLATE_BATCH < toTranslate.length) await sleep(800);
  }

  console.log(`\n✓ ${done} jeux traduits${errs > 0 ? `, ${errs} batch(es) en erreur` : ""}`);
}

// ═════════════════════════════════════════════════════════════════════════════
// Main
// ═════════════════════════════════════════════════════════════════════════════

async function main() {
  const phaseArg  = process.argv.find(a => a.startsWith("--phase="));
  const phaseOnly = phaseArg ? parseInt(phaseArg.split("=")[1]) : null;

  console.log("══════════════════════════════════════════════");
  console.log("  Jeux — nettoyage & traduction");
  console.log("══════════════════════════════════════════════");

  if (!phaseOnly || phaseOnly === 1) await phase1HtmlCleanup();
  if (!phaseOnly || phaseOnly === 2) await phase2Deduplication();
  if (!phaseOnly || phaseOnly === 3) await phase3Translation();

  console.log("\n══════════════════════════════════════════════");
  console.log("  Terminé");
  console.log("══════════════════════════════════════════════\n");
}

main().catch(err => { console.error(err); process.exit(1); });
