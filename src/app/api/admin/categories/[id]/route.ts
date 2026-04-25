import { NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase/service";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  const { id } = await params;
  const sb = createServiceClient();
  const body = await req.json();
  const { data, error } = await sb
    .from("categories")
    .update(body)
    .eq("id", id)
    .select("id, slug, nom, type, parent_id, actif, position, spotify_playlist_id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const sb = createServiceClient();
  const body = await req.json() as { actif?: boolean; position?: number };
  const update: Record<string, unknown> = {};
  if (body.actif !== undefined) update.actif = body.actif;
  if (body.position !== undefined) update.position = body.position;
  if (!Object.keys(update).length) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  const { error } = await sb.from("categories").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: Params) {
  const { id } = await params;
  const sb = createServiceClient();
  // Reassign children to parent before deleting
  const { data: cat } = await sb.from("categories").select("parent_id").eq("id", id).single();
  if (cat) {
    await sb
      .from("categories")
      .update({ parent_id: (cat as { parent_id: string | null }).parent_id })
      .eq("parent_id", id);
  }
  const { error } = await sb.from("categories").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
