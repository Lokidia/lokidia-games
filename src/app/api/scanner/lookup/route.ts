import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase/service";

// GET /api/scanner/lookup?ean=xxx
export async function GET(req: NextRequest) {
  const eanRaw = req.nextUrl.searchParams.get("ean");
  const ean = eanRaw?.trim() ?? "";

  console.log(`[scanner/lookup] EAN reçu (brut): "${eanRaw}" → normalisé: "${ean}"`);

  if (!ean) return NextResponse.json({ error: "ean requis" }, { status: 400 });

  const svc = createServiceClient();

  // 1. Direct EAN match (text column, force string comparison)
  const { data: byEan, error: eanErr } = await svc
    .from("jeux")
    .select("slug, nom, image_url, note, ean")
    .eq("ean", String(ean))
    .eq("actif", true)
    .maybeSingle();

  console.log(`[scanner/lookup] Résultat EAN direct:`, byEan, eanErr ? `erreur: ${eanErr.message}` : "");

  if (byEan) return NextResponse.json({ found: true, jeu: byEan });

  // 2. Fallback: search without actif filter to detect inactive entries
  const { data: byEanAny } = await svc
    .from("jeux")
    .select("slug, nom, actif, ean")
    .eq("ean", String(ean))
    .maybeSingle();

  if (byEanAny) {
    console.log(`[scanner/lookup] Jeu trouvé mais inactif:`, byEanAny);
    return NextResponse.json({ found: false, ean, debug: "jeu_inactif" });
  }

  // 3. EAN in Amazon/prix URL
  const { data: byPrix } = await svc
    .from("jeux_prix")
    .select("url, jeux!inner(slug, nom, image_url, note, actif)")
    .like("url", `%${ean}%`)
    .limit(1);

  console.log(`[scanner/lookup] Résultat prix URL:`, byPrix?.length ?? 0, "ligne(s)");

  if (byPrix && byPrix.length > 0) {
    const row = byPrix[0] as unknown as { jeux: { slug: string; nom: string; image_url: string | null; note: number; actif: boolean } };
    if (row.jeux?.actif) {
      return NextResponse.json({ found: true, jeu: row.jeux });
    }
  }

  console.log(`[scanner/lookup] Aucun jeu trouvé pour EAN "${ean}"`);
  return NextResponse.json({ found: false, ean });
}
