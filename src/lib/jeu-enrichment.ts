import Anthropic from "@anthropic-ai/sdk";
import { createServiceClient } from "@/utils/supabase/service";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const AFFILIATE_TAG = "lokidia21-21";

export async function harmonizeName(nom: string): Promise<string> {
  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 60,
    messages: [{
      role: "user",
      content: `Harmonise ce nom de jeu de société pour le catalogue français :
- Supprime les préfixes commerciaux inutiles : "Asmodee -", "GIGAMIC -", "IELLO -", "VF -", "Jeu de société -", etc.
- Corrige les noms entièrement en MAJUSCULES (ex: "CATAN" → "Catan", "PANDEMIC" → "Pandemic")
- Met la première lettre du premier mot en majuscule, le reste en minuscules (sauf noms propres et sigles)
- Traduis en français si une traduction officielle reconnue existe (ex: "Ticket to Ride" → "Les Aventuriers du Rail", "Pandemic" → "Pandémie")
- Si aucune traduction officielle n'est connue avec certitude, garde le nom original

Nom à harmoniser : "${nom}"
Réponds UNIQUEMENT avec le nom harmonisé, sans guillemets, sans explication.`,
    }],
  });
  const block = msg.content[0];
  if (!block || block.type !== "text") return nom;
  return block.text.trim() || nom;
}

export function toSlug(nom: string): string {
  return nom
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export interface EnrichedData {
  description: string;
  mecaniques: string[];
  regles: string[];
  points_forts: string[];
  joueurs_min: number;
  joueurs_max: number;
  duree_min: number;
  duree_max: number;
  age_min: number;
  complexite: string;
}

export async function enrichWithClaude(nom: string, contexte = ""): Promise<EnrichedData> {
  const contextBlock = contexte.trim()
    ? `\nContexte source à exploiter si utile, sans copier le texte commercial :\n${contexte.slice(0, 1200)}\n`
    : "";
  const prompt = `Tu es un expert en jeux de société. Pour le jeu "${nom}", génère en JSON strict (sans markdown) :
{
  "description": "description en français, ~150 mots, ton enthousiaste",
  "mecaniques": ["3 à 5 mécaniques de jeu"],
  "regles": ["5 à 6 étapes résumant les règles"],
  "points_forts": ["3 à 5 points forts pour la section Pourquoi ce jeu ?"],
  "joueurs_min": 2,
  "joueurs_max": 4,
  "duree_min": 30,
  "duree_max": 60,
  "age_min": 10,
  "complexite": "Simple | Intermédiaire | Complexe | Expert"
}
Réponds uniquement avec le JSON, sans explication.`;

  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt + contextBlock }],
  });

  const block = msg.content[0];
  if (!block || block.type !== "text") throw new Error("Réponse Claude invalide");
  const text = block.text.trim();
  const jsonStr = text.startsWith("{") ? text : text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  return JSON.parse(jsonStr) as EnrichedData;
}

interface Categorie { id: string; nom: string; slug: string }

export async function autoCategorize(
  sb: ReturnType<typeof createServiceClient>,
  jeuId: string,
  nom: string,
  description: string,
  categories: Categorie[]
): Promise<string[]> {
  if (categories.length === 0) return [];

  const catList = categories.map((c) => `- ${c.nom} (slug: ${c.slug})`).join("\n");
  const prompt = `Tu es un expert en jeux de société. Voici un jeu :
Nom : "${nom}"
Description : "${description.slice(0, 300)}"

Voici la liste des catégories disponibles :
${catList}

Choisis les 2 à 4 catégories les plus pertinentes. Réponds uniquement avec un JSON strict :
{ "slugs": ["slug1", "slug2"] }`;

  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    messages: [{ role: "user", content: prompt }],
  });

  const text = (msg.content[0] as { type: string; text: string }).text.trim();
  const jsonStr = text.startsWith("{") ? text : text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  const { slugs } = JSON.parse(jsonStr) as { slugs: string[] };

  const matched = categories.filter((c) => slugs.includes(c.slug));
  if (matched.length === 0) return [];

  await sb.from("jeux_categories").insert(
    matched.map((c) => ({ jeu_id: jeuId, categorie_id: c.id }))
  );
  return matched.map((c) => c.id);
}

export async function autoAssociate(
  sb: ReturnType<typeof createServiceClient>,
  jeuId: string,
  nom: string,
  categorieIds: string[]
): Promise<void> {
  const candidates: { id: string; score: number }[] = [];

  if (categorieIds.length > 0) {
    const { data: byCategory } = await sb
      .from("jeux_categories")
      .select("jeu_id, jeux!inner(id, nom, actif)")
      .in("categorie_id", categorieIds)
      .neq("jeu_id", jeuId)
      .limit(50);

    if (byCategory) {
      const counts: Record<string, { id: string; score: number }> = {};
      for (const row of byCategory) {
        const j = (row as unknown as { jeu_id: string; jeux: { id: string; nom: string; actif: boolean } }).jeux;
        if (!j?.actif) continue;
        if (!counts[j.id]) counts[j.id] = { id: j.id, score: 0 };
        counts[j.id].score++;
      }
      candidates.push(...Object.values(counts));
    }
  }

  if (candidates.length < 3) {
    const words = nom.split(/\s+/).filter((w) => w.length > 3);
    for (const word of words.slice(0, 2)) {
      const { data: byName } = await sb
        .from("jeux")
        .select("id")
        .ilike("nom", `%${word}%`)
        .neq("id", jeuId)
        .eq("actif", true)
        .limit(5);
      if (byName) {
        for (const j of byName as { id: string }[]) {
          if (!candidates.find((c) => c.id === j.id)) {
            candidates.push({ id: j.id, score: 0.5 });
          }
        }
      }
    }
  }

  const top3 = candidates.sort((a, b) => b.score - a.score).slice(0, 3);
  if (top3.length === 0) return;

  await sb
    .from("jeux_relations")
    .insert(top3.map((j) => ({ jeu_id: jeuId, jeu_lie_id: j.id, type: "similaire" })));
}
