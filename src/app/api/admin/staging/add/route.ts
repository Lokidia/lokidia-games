import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase/service";
import { toSlug, AFFILIATE_TAG } from "@/lib/jeu-enrichment";

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .replace(/\b(version francaise|vf|francais|jeu de societe|jeu de plateau|board game)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.nom) return NextResponse.json({ error: "nom requis" }, { status: 400 });

  const sb = createServiceClient();
  const nom = body.nom as string;
  const asin = (body.asin as string | undefined)?.trim() || null;
  const source = (body.source as string | undefined) ?? "amazon";
  const normalizedName = normalizeName(nom);

  // Duplicate detection: check jeux by slug first, then by name
  const slug = toSlug(nom);
  const { data: bySlug } = await sb
    .from("jeux")
    .select("id, slug, nom")
    .eq("slug", slug)
    .maybeSingle();
  const { data: byNom } = bySlug
    ? { data: null }
    : await sb.from("jeux").select("id, slug, nom").ilike("nom", nom).maybeSingle();
  const inJeux = bySlug ?? byNom;

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
      .select("id, nom, statut, data_brute")
      .limit(500);
    inStaging = (data ?? []).find((row) => {
      const raw = row as { nom: string; data_brute?: { normalizedName?: string } | null };
      return (raw.data_brute?.normalizedName ?? normalizeName(raw.nom)) === normalizedName;
    }) ?? null;
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
      data_brute: {
        ...(body.data_brute ?? {}),
        normalizedName,
        stagedAt: new Date().toISOString(),
      },
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
