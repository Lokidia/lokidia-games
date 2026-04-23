import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase/service";
import {
  toSlug,
  enrichWithClaude,
  autoCategorize,
  autoAssociate,
  AFFILIATE_TAG,
} from "@/lib/jeu-enrichment";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.nom) return NextResponse.json({ error: "nom requis" }, { status: 400 });

  const sb = createServiceClient();
  const slug = toSlug(body.nom as string);

  const { data: existing } = await sb
    .from("jeux")
    .select("id, slug, nom")
    .or(`slug.eq.${slug},nom.ilike.${body.nom}`)
    .limit(1)
    .single();

  if (existing) return NextResponse.json({ duplicate: true, jeu: existing }, { status: 409 });

  const { data: allCats } = await sb.from("categories").select("id, nom, slug").eq("actif", true).order("nom");

  let enriched;
  try {
    enriched = await enrichWithClaude(body.nom as string);
  } catch {
    enriched = {
      description: "",
      mecaniques: [] as string[],
      regles: [] as string[],
      points_forts: [] as string[],
      joueurs_min: 2,
      joueurs_max: 4,
      duree_min: 30,
      duree_max: 60,
      age_min: 8,
      complexite: "Intermédiaire",
    };
  }

  const { data, error } = await sb
    .from("jeux")
    .insert({
      slug,
      nom: body.nom,
      annee: body.annee ?? new Date().getFullYear(),
      description: enriched.description,
      joueurs_min: enriched.joueurs_min,
      joueurs_max: enriched.joueurs_max,
      duree_min: enriched.duree_min,
      duree_max: enriched.duree_max,
      age_min: enriched.age_min,
      complexite: enriched.complexite,
      note: 0,
      mecaniques: enriched.mecaniques,
      regles: enriched.regles,
      points_forts: enriched.points_forts,
      image_url: body.image ?? null,
      actif: false,
    })
    .select("id, slug")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const jeuId = (data as { id: string }).id;
  const asin = (body.asin as string | undefined)?.trim();
  const amazonUrl = asin
    ? `https://www.amazon.fr/dp/${asin}?tag=${AFFILIATE_TAG}`
    : (body.url as string | undefined) ?? null;

  if (amazonUrl) {
    await sb.from("jeux_prix").insert({ jeu_id: jeuId, marchand: "amazon", url: amazonUrl, prix: body.prix ?? "" });
  }

  let catIds: string[] = [];
  try { catIds = await autoCategorize(sb, jeuId, body.nom as string, enriched.description, allCats ?? []); } catch { /* silent */ }
  try { await autoAssociate(sb, jeuId, body.nom as string, catIds); } catch { /* silent */ }

  return NextResponse.json({ success: true, jeu: data }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const nom = req.nextUrl.searchParams.get("nom") ?? "";
  if (!nom) return NextResponse.json({ exists: false });

  const sb = createServiceClient();
  const slug = toSlug(nom);
  const { data } = await sb
    .from("jeux")
    .select("id, slug, nom")
    .or(`slug.eq.${slug},nom.ilike.${encodeURIComponent(nom)}`)
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ exists: !!data, jeu: data ?? null });
}
