import { NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase/service";

export async function GET() {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("categories")
    .select("id, slug, nom, type, parent_id, actif, position, spotify_playlist_id")
    .order("nom");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const sb = createServiceClient();
  const body = await req.json();
  const { data, error } = await sb
    .from("categories")
    .insert(body)
    .select("id, slug, nom, type, parent_id, actif, position, spotify_playlist_id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
