import { NextRequest, NextResponse } from "next/server";
import { jeux } from "@/data/jeux";
import { getAnthropicClient } from "@/lib/anthropic";

const client = getAnthropicClient();

const SYSTEM_PROMPT = `Tu es un expert passionné de jeux de société. Ton rôle est d'aider les utilisateurs à trouver le jeu parfait pour eux.

Voici les jeux disponibles dans notre encyclopédie :
${jeux.map((j) => `- ${j.nom} (${j.categories.join(", ")}) : ${j.joueursMin}-${j.joueursMax} joueurs, ${j.dureeMin}-${j.dureeMax}min, ${j.complexite}`).join("\n")}

Règles :
- Pose des questions courtes pour cerner les besoins (nb joueurs, âge, type de jeu, temps disponible)
- Recommande 1 à 3 jeux en expliquant pourquoi ils correspondent
- Reste enthousiaste, concis et en français
- Si le jeu n'est pas dans la liste, dis-le honnêtement`;

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: messages.map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content,
    })),
  });

  const reply = response.content[0].type === "text" ? response.content[0].text : "";
  return NextResponse.json({ reply });
}
