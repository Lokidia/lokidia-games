import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase/service";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const statut = searchParams.get("statut"); // en_attente | approuve | rejete | null=all
  const source = searchParams.get("source");
  const limit = Math.min(Number(searchParams.get("limit") ?? 100), 200);

  const sb = createServiceClient();
  let query = sb
    .from("jeux_staging")
    .select("id, nom, asin, prix, image_url, url_amazon, source, statut, date_scraping, doublon_detecte, doublon_ref, jeu_id")
    .order("date_scraping", { ascending: false })
    .limit(limit);

  if (statut) query = query.eq("statut", statut);
  if (source) query = query.eq("source", source);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ items: data ?? [] });
}
