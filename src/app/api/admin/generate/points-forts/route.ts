import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(req: Request) {
  try {
    const { nom, description, joueurs_min, joueurs_max, duree_min, duree_max, complexite, mecaniques } =
      await req.json() as {
        nom: string;
        description: string;
        joueurs_min: number;
        joueurs_max: number;
        duree_min: number;
        duree_max: number;
        complexite: string;
        mecaniques: string[];
      };

    const prompt = `Tu es un expert en jeux de société. Génère 4 points forts concis pour le jeu "${nom}".

Informations :
- Description : ${description?.slice(0, 400)}
- Joueurs : ${joueurs_min}–${joueurs_max}
- Durée : ${duree_min}–${duree_max} min
- Complexité : ${complexite}
- Mécaniques : ${mecaniques?.slice(0, 5).join(", ") || "N/A"}

Règles :
- 4 points maximum
- Chaque point = une courte phrase positive (max 8 mots), sans le ✔ devant
- Mets en avant les bénéfices pour le joueur (fun, facilité, durée, convivialité, rejouabilité…)
- En français, ton enthousiaste mais factuel

Réponds UNIQUEMENT avec un tableau JSON valide, exemple :
["Facile à apprendre dès la première partie","Idéal pour les soirées en famille","Parties courtes et rythmées","Grande rejouabilité grâce aux tuiles aléatoires"]`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text.trim() : "";

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("Réponse invalide du modèle");

    const points = JSON.parse(jsonMatch[0]) as string[];
    if (!Array.isArray(points)) throw new Error("Format inattendu");

    return NextResponse.json({ points: points.slice(0, 5) });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
