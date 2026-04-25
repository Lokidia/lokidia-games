import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase/service";

// GET /api/scanner/lookup?ean=xxx
export async function GET(req: NextRequest) {
  const ean = req.nextUrl.searchParams.get("ean")?.trim();
  if (!ean) return NextResponse.json({ error: "ean requis" }, { status: 400 });

  const svc = createServiceClient();

  // 1. Try direct EAN match on jeux table
  const { data: byEan } = await svc
    .from("jeux")
    .select("slug, nom, image_url, note")
    .eq("ean", ean)
    .eq("actif", true)
    .single();

  if (byEan) return NextResponse.json({ found: true, jeu: byEan });

  // 2. EAN-13 → ASIN heuristic: Amazon ASIN can sometimes be derived
  //    from the EAN. Try matching against jeux_prix URLs containing the EAN.
  const { data: byPrix } = await svc
    .from("jeux_prix")
    .select("url, jeux!inner(slug, nom, image_url, note, actif)")
    .like("url", `%${ean}%`)
    .limit(1);

  if (byPrix && byPrix.length > 0) {
    const row = byPrix[0] as unknown as { jeux: { slug: string; nom: string; image_url: string | null; note: number; actif: boolean } };
    if (row.jeux?.actif) {
      return NextResponse.json({ found: true, jeu: row.jeux });
    }
  }

  return NextResponse.json({ found: false, ean });
}
