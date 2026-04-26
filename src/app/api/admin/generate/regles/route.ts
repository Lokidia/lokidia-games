import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(req: Request) {
  try {
    const { nom, description, mecaniques } = await req.json() as {
      nom: string;
      description?: string;
      mecaniques?: string[];
    };

    const extra = [
      description ? `Description : ${description.slice(0, 300)}` : "",
      mecaniques?.length ? `Mécaniques : ${mecaniques.join(", ")}` : "",
    ].filter(Boolean).join("\n");

    const prompt = `Tu es un expert en jeux de société. Génère 6 étapes claires et concises pour expliquer comment jouer à "${nom}".
${extra}

Chaque étape doit être une phrase courte et actionnable commençant par un verbe (ex : "Placez", "Distribuez", "Le joueur actif").
Réponds UNIQUEMENT en JSON valide : { "regles": ["étape 1", "étape 2", ...] }`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text.trim() : "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Réponse invalide du modèle");

    const parsed = JSON.parse(match[0]) as { regles?: string[] };
    if (!Array.isArray(parsed.regles)) throw new Error("Format inattendu");

    return NextResponse.json({ regles: parsed.regles.slice(0, 8) });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
