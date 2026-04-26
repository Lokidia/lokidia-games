import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(req: Request) {
  try {
    const { nom, description, mecaniques, categories } = await req.json() as {
      nom: string;
      description?: string;
      mecaniques?: string[];
      categories: { id: string; nom: string }[];
    };

    if (!categories?.length) return NextResponse.json({ ids: [] });

    const catList = categories.map((c) => `${c.id}: ${c.nom}`).join("\n");

    const context = [
      description ? `Description : ${description.slice(0, 300)}` : "",
      mecaniques?.length ? `Mécaniques : ${mecaniques.slice(0, 6).join(", ")}` : "",
    ].filter(Boolean).join("\n");

    const prompt = `Tu es un expert en jeux de société. Voici un jeu de société et une liste de catégories disponibles.

Jeu : "${nom}"
${context}

Catégories disponibles (format "id: nom") :
${catList}

Choisis les 2 à 4 catégories les plus pertinentes pour ce jeu parmi la liste ci-dessus.
Réponds UNIQUEMENT en JSON valide avec les IDs des catégories choisies : { "ids": ["id1", "id2"] }`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 150,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text.trim() : "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Réponse invalide du modèle");

    const parsed = JSON.parse(match[0]) as { ids?: string[] };
    if (!Array.isArray(parsed.ids)) throw new Error("Format inattendu");

    const validIds = new Set(categories.map((c) => c.id));
    const filtered = parsed.ids.filter((id) => validIds.has(id)).slice(0, 4);

    return NextResponse.json({ ids: filtered });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
