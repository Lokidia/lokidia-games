import { NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase/service";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) return NextResponse.json([]);

  const sb = createServiceClient();
  const { data, error } = await sb
    .from("jeux")
    .select("slug, nom, note, image_url")
    .ilike("nom", `%${q}%`)
    .eq("actif", true)
    .order("note", { ascending: false })
    .limit(6);

  if (error) return NextResponse.json([], { status: 500 });
  return NextResponse.json(data ?? []);
}
