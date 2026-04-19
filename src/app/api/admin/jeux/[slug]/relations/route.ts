import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase/service";

type Params = { params: Promise<{ slug: string }> };

async function getJeuId(slug: string): Promise<string | null> {
  const sb = createServiceClient();
  const { data } = await sb.from("jeux").select("id").eq("slug", slug).single();
  return (data as { id: string } | null)?.id ?? null;
}

/* GET — list all relations for a game */
export async function GET(_req: NextRequest, { params }: Params) {
  const { slug } = await params;
  const jeuId = await getJeuId(slug);
  if (!jeuId) return NextResponse.json({ error: "Jeu introuvable" }, { status: 404 });

  const sb = createServiceClient();
  const { data, error } = await sb
    .from("jeux_relations")
    .select(`
      id, type,
      jeu_lie:jeu_lie_id ( id, slug, nom, image_url, note, complexite )
    `)
    .eq("jeu_id", jeuId)
    .order("type")
    .order("created_at");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

/* POST — add a relation */
export async function POST(req: NextRequest, { params }: Params) {
  const { slug } = await params;
  const jeuId = await getJeuId(slug);
  if (!jeuId) return NextResponse.json({ error: "Jeu introuvable" }, { status: 404 });

  const body = (await req.json()) as { jeu_lie_slug: string; type: string };
  if (!body.jeu_lie_slug || !body.type) {
    return NextResponse.json({ error: "jeu_lie_slug and type required" }, { status: 400 });
  }

  const validTypes = ["extension", "similaire", "reimplementation"];
  if (!validTypes.includes(body.type)) {
    return NextResponse.json({ error: "type invalide" }, { status: 400 });
  }

  const sb = createServiceClient();
  const { data: lie } = await sb
    .from("jeux")
    .select("id")
    .eq("slug", body.jeu_lie_slug)
    .single();

  if (!lie) return NextResponse.json({ error: "Jeu lié introuvable" }, { status: 404 });
  const jeuLieId = (lie as { id: string }).id;

  if (jeuLieId === jeuId) {
    return NextResponse.json({ error: "Un jeu ne peut pas être lié à lui-même" }, { status: 400 });
  }

  const { data, error } = await sb
    .from("jeux_relations")
    .insert({ jeu_id: jeuId, jeu_lie_id: jeuLieId, type: body.type })
    .select(`id, type, jeu_lie:jeu_lie_id ( id, slug, nom, image_url, note, complexite )`)
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Cette relation existe déjà" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
