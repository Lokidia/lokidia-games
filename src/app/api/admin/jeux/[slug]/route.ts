import { NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase/service";

const FULL_SELECT = `
  id, slug, nom, annee, description,
  joueurs_min, joueurs_max, duree_min, duree_max, age_min,
  complexite, note, mecaniques, regles, points_forts, image_url, updated_at,
  jeux_prix(marchand, prix, url),
  jeux_categories(categorie_id, categories(id, nom))
`;

type Params = { params: Promise<{ slug: string }> };

export async function GET(_: Request, { params }: Params) {
  const { slug } = await params;
  const sb = createServiceClient();
  const { data, error } = await sb.from("jeux").select(FULL_SELECT).eq("slug", slug).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(req: Request, { params }: Params) {
  const { slug } = await params;
  const sb = createServiceClient();
  const body = await req.json();
  const { prix, categories: categoryIds, ...jeuData } = body;

  const { data: existing } = await sb.from("jeux").select("id").eq("slug", slug).single();
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const jeuId = (existing as { id: string }).id;

  const { error: jeuErr } = await sb.from("jeux").update(jeuData).eq("id", jeuId);
  if (jeuErr) return NextResponse.json({ error: jeuErr.message }, { status: 400 });

  if (prix) {
    const prixRows = (["amazon", "philibert", "cultura", "fnac"] as const).map(
      (m) => ({ jeu_id: jeuId, marchand: m, url: prix[m]?.url ?? "", prix: prix[m]?.prix ?? "" }),
    );
    await sb.from("jeux_prix").upsert(prixRows, { onConflict: "jeu_id,marchand" });
  }

  if (categoryIds !== undefined) {
    await sb.from("jeux_categories").delete().eq("jeu_id", jeuId);
    if (Array.isArray(categoryIds) && categoryIds.length > 0) {
      await sb
        .from("jeux_categories")
        .insert(categoryIds.map((cid: string) => ({ jeu_id: jeuId, categorie_id: cid })));
    }
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request, { params }: Params) {
  const { slug } = await params;
  const sb = createServiceClient();
  const { actif } = await req.json() as { actif: boolean };
  const { error } = await sb.from("jeux").update({ actif }).eq("slug", slug);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: Params) {
  const { slug } = await params;
  const sb = createServiceClient();

  const { data: existing } = await sb.from("jeux").select("id").eq("slug", slug).single();
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const jeuId = (existing as { id: string }).id;

  await sb.from("jeux_categories").delete().eq("jeu_id", jeuId);
  await sb.from("jeux_prix").delete().eq("jeu_id", jeuId);
  const { error } = await sb.from("jeux").delete().eq("id", jeuId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
