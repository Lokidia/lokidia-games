import { NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase/service";

const LIST_SELECT = `
  id, slug, nom, annee, complexite, note, image_url, updated_at, actif, ean, youtube_id,
  jeux_prix(marchand, prix, url),
  jeux_categories(categories(id, nom))
`;

export async function GET() {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("jeux")
    .select(LIST_SELECT)
    .order("nom");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const sb = createServiceClient();
  const body = await req.json();
  const { prix, categories: categoryIds, ...jeuData } = body;

  const { data: jeu, error: jeuErr } = await sb
    .from("jeux")
    .insert(jeuData)
    .select("id, slug")
    .single();
  if (jeuErr) return NextResponse.json({ error: jeuErr.message }, { status: 400 });

  const jeuId = (jeu as { id: string; slug: string }).id;

  if (prix) {
    const prixRows = (["amazon", "philibert", "cultura", "fnac"] as const).map(
      (m) => ({ jeu_id: jeuId, marchand: m, url: prix[m]?.url ?? "", prix: prix[m]?.prix ?? "" }),
    );
    await sb.from("jeux_prix").upsert(prixRows, { onConflict: "jeu_id,marchand" });
  }

  if (Array.isArray(categoryIds) && categoryIds.length > 0) {
    await sb
      .from("jeux_categories")
      .insert(categoryIds.map((cid: string) => ({ jeu_id: jeuId, categorie_id: cid })));
  }

  return NextResponse.json(jeu, { status: 201 });
}
