import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServiceClient } from "@/utils/supabase/service";

const client = new Anthropic();

// POST /api/admin/enrichissement/auto
// Body: { slug: string }
// Generates missing description / regles / mecaniques via Claude Haiku and saves them.
export async function POST(req: NextRequest) {
  try {
    const { slug } = await req.json() as { slug: string };
    if (!slug) return NextResponse.json({ error: "slug requis" }, { status: 400 });

    const svc = createServiceClient();

    const { data: jeu, error: fetchErr } = await svc
      .from("jeux")
      .select(`
        id, nom, description, regles, mecaniques,
        annee, joueurs_min, joueurs_max, duree_min, duree_max, complexite,
        jeux_categories(categories(nom))
      `)
      .eq("slug", slug)
      .single();

    if (fetchErr || !jeu) return NextResponse.json({ error: "Jeu introuvable" }, { status: 404 });

    type JeuRow = typeof jeu & {
      jeux_categories: { categories: { nom: string } | null }[];
    };
    const row = jeu as unknown as JeuRow;

    const needsDesc      = !row.description || row.description.length < 50;
    const needsRegles    = !row.regles || row.regles.length === 0;
    const needsMecaniques = !row.mecaniques || row.mecaniques.length === 0;

    if (!needsDesc && !needsRegles && !needsMecaniques) {
      return NextResponse.json({ unchanged: true });
    }

    const categories = (row.jeux_categories ?? [])
      .map((jc: { categories: { nom: string } | null }) => jc.categories?.nom)
      .filter(Boolean)
      .join(", ") || "N/A";

    const fieldsToGen: string[] = [];
    if (needsDesc)       fieldsToGen.push('"description": présentation du jeu (150-250 mots, français, ton enthousiaste)');
    if (needsRegles)     fieldsToGen.push('"regles": tableau de 5-8 règles courtes (strings, en français, commencer par un verbe)');
    if (needsMecaniques) fieldsToGen.push('"mecaniques": tableau de 3-6 mots-clés de mécaniques (ex: "Draft", "Placement de tuiles", "Coopératif")');

    const prompt = `Tu es un expert en jeux de société. Jeu : "${row.nom}" (${row.annee ?? "?"}).
Joueurs : ${row.joueurs_min ?? "?"}–${row.joueurs_max ?? "?"} · Durée : ${row.duree_min ?? "?"}–${row.duree_max ?? "?"} min
Complexité : ${row.complexite ?? "?"} · Catégories : ${categories}
${row.description ? `Description actuelle : ${row.description.slice(0, 200)}` : ""}

Génère UNIQUEMENT les champs suivants en JSON valide :
${fieldsToGen.join("\n")}

Réponds avec un objet JSON uniquement, sans texte autour. Exemple :
{"description":"...","regles":["..."],"mecaniques":["..."]}`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });

    const raw  = message.content[0].type === "text" ? message.content[0].text.trim() : "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Réponse invalide du modèle");

    const generated = JSON.parse(match[0]) as {
      description?: string;
      regles?: string[];
      mecaniques?: string[];
    };

    const updates: Record<string, unknown> = {};
    if (needsDesc       && generated.description) updates.description = generated.description;
    if (needsRegles     && generated.regles)       updates.regles      = generated.regles;
    if (needsMecaniques && generated.mecaniques)   updates.mecaniques  = generated.mecaniques;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ unchanged: true });
    }

    const { error: updateErr } = await svc.from("jeux").update(updates).eq("slug", slug);
    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

    return NextResponse.json({ ok: true, ...updates });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
