import { NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase/service";

type Params = { params: Promise<{ jeuId: string }> };

export async function GET(_: Request, { params }: Params) {
  const { jeuId } = await params;
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("jeux_categories")
    .select("categorie_id")
    .eq("jeu_id", jeuId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data ?? []).map((r: { categorie_id: string }) => r.categorie_id));
}

export async function PUT(req: Request, { params }: Params) {
  const { jeuId } = await params;
  const sb = createServiceClient();
  const { categoryIds } = await req.json();

  await sb.from("jeux_categories").delete().eq("jeu_id", jeuId);
  if (Array.isArray(categoryIds) && categoryIds.length > 0) {
    await sb
      .from("jeux_categories")
      .insert(categoryIds.map((cid: string) => ({ jeu_id: jeuId, categorie_id: cid })));
  }
  return NextResponse.json({ ok: true });
}
