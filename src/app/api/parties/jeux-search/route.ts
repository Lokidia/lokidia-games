import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase/service";

// GET /api/parties/jeux-search?q=xxx
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const svc = createServiceClient();

  const query = svc
    .from("jeux")
    .select("id, nom, slug")
    .eq("actif", true)
    .order("nom")
    .limit(30);

  if (q) query.ilike("nom", `%${q}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ jeux: data ?? [] });
}
