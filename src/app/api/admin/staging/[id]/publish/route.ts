import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase/service";
import {
  toSlug,
  harmonizeName,
  enrichWithClaude,
  autoCategorize,
  autoAssociate,
} from "@/lib/jeu-enrichment";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = createServiceClient();

  // Fetch staging item
  const { data: item, error: fetchErr } = await sb
    .from("jeux_staging")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchErr || !item) return NextResponse.json({ error: "introuvable" }, { status: 404 });
  if ((item as { statut: string }).statut === "approuve") {
    return NextResponse.json({ error: "déjà publié" }, { status: 409 });
  }

  const row = item as {
    nom: string;
    asin: string | null;
    prix: string | null;
    image_url: string | null;
    url_amazon: string | null;
    description_brute: string | null;
    data_brute: { raisons?: string[]; alertes?: string[]; rating?: number; reviewsCount?: number } | null;
    source: string;
    annee?: number;
  };

  // Harmonize name via Claude Haiku
  let nom = row.nom;
  try {
    nom = await harmonizeName(row.nom);
  } catch { /* keep original on error */ }

  const slug = toSlug(nom);

  // Check duplicate in jeux (safe: two separate parameterized queries)
  const { data: bySlug } = await sb.from("jeux").select("id, slug, nom").eq("slug", slug).maybeSingle();
  const { data: byNom } = bySlug
    ? { data: null }
    : await sb.from("jeux").select("id, slug, nom").ilike("nom", nom).maybeSingle();
  const existing = bySlug ?? byNom;

  if (existing) {
    await sb.from("jeux_staging").update({ statut: "approuve", jeu_id: (existing as { id: string }).id }).eq("id", id);
    return NextResponse.json({ duplicate: true, jeu: existing }, { status: 409 });
  }

  // Enrich with Claude
  let enriched;
  try {
    const scrapeContext = [
      row.description_brute,
      row.data_brute?.raisons?.length ? `Signaux qualité : ${row.data_brute.raisons.join(", ")}` : "",
      row.data_brute?.rating ? `Note Amazon : ${row.data_brute.rating}/5` : "",
      row.data_brute?.reviewsCount ? `Avis Amazon : ${row.data_brute.reviewsCount}` : "",
    ].filter(Boolean).join("\n");
    enriched = await enrichWithClaude(nom, scrapeContext);
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

  const { data: jeuData, error: insertErr } = await sb
    .from("jeux")
    .insert({
      slug,
      nom,
      annee: row.annee ?? new Date().getFullYear(),
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
      image_url: row.image_url ?? null,
      actif: false,
    })
    .select("id, slug, nom")
    .single();

  if (insertErr || !jeuData) {
    return NextResponse.json({ error: insertErr?.message ?? "insert failed" }, { status: 500 });
  }

  const jeuId = (jeuData as { id: string }).id;

  // Save Amazon price
  if (row.url_amazon) {
    await sb.from("jeux_prix").insert({
      jeu_id: jeuId,
      marchand: "amazon",
      url: row.url_amazon,
      prix: row.prix ?? "",
    });
  }

  // Auto-categorize + auto-associate
  const { data: allCats } = await sb.from("categories").select("id, nom, slug").eq("actif", true).order("nom");
  let catIds: string[] = [];
  try {
    catIds = await autoCategorize(sb, jeuId, nom, enriched.description, allCats ?? []);
  } catch { /* silent */ }
  try {
    await autoAssociate(sb, jeuId, nom, catIds);
  } catch { /* silent */ }

  // Mark staging as approved
  await sb.from("jeux_staging").update({ statut: "approuve", jeu_id: jeuId }).eq("id", id);

  return NextResponse.json({
    success: true,
    jeu: jeuData,
    nomOriginal: row.nom,
    nomHarmonise: nom,
    harmonise: nom !== row.nom,
  });
}
