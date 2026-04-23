import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase/service";
import { toSlug, AFFILIATE_TAG } from "@/lib/jeu-enrichment";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.nom) return NextResponse.json({ error: "nom requis" }, { status: 400 });

  const sb = createServiceClient();
  const nom = body.nom as string;
  const asin = (body.asin as string | undefined)?.trim() || null;
  const source = (body.source as string | undefined) ?? "amazon";

  // Duplicate detection: check jeux by name
  const slug = toSlug(nom);
  const { data: inJeux } = await sb
    .from("jeux")
    .select("id, slug, nom")
    .or(`slug.eq.${slug},nom.ilike.${nom}`)
    .limit(1)
    .maybeSingle();

  // Duplicate detection: check staging by ASIN or name
  let inStaging = null;
  if (asin) {
    const { data } = await sb
      .from("jeux_staging")
      .select("id, nom, statut")
      .eq("asin", asin)
      .limit(1)
      .maybeSingle();
    inStaging = data;
  }
  if (!inStaging) {
    const { data } = await sb
      .from("jeux_staging")
      .select("id, nom, statut")
      .ilike("nom", nom)
      .limit(1)
      .maybeSingle();
    inStaging = data;
  }

  const doublonDetecte = !!(inJeux || inStaging);
  const doublonRef = inJeux
    ? `jeux: ${inJeux.nom}`
    : inStaging
    ? `staging: ${(inStaging as { nom: string }).nom}`
    : null;

  const amazonUrl = asin
    ? `https://www.amazon.fr/dp/${asin}?tag=${AFFILIATE_TAG}`
    : (body.url as string | undefined) ?? null;

  const { data, error } = await sb
    .from("jeux_staging")
    .insert({
      nom,
      asin,
      prix: body.prix ?? null,
      image_url: body.image ?? null,
      url_amazon: amazonUrl,
      description_brute: body.description ?? null,
      source,
      statut: "en_attente",
      data_brute: body.data_brute ?? null,
      doublon_detecte: doublonDetecte,
      doublon_ref: doublonRef,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    success: true,
    staging_id: (data as { id: string }).id,
    doublon_detecte: doublonDetecte,
    doublon_ref: doublonRef,
  }, { status: 201 });
}
