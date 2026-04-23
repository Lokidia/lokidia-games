import { NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase/service";

type MobileJeuListItem = {
  slug: string;
  nom: string;
  note: number;
  imageUrl: string | null;
  joueursMin: number;
  joueursMax: number;
  dureeMin: number;
  dureeMax: number;
  ageMin: number;
  complexite: string;
  description: string;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const limitParam = Number(searchParams.get("limit") ?? "20");
  const limit = Number.isFinite(limitParam)
    ? Math.min(Math.max(limitParam, 1), 100)
    : 20;

  const sb = createServiceClient();
  let query = sb
    .from("jeux")
    .select(
      "slug, nom, note, image_url, joueurs_min, joueurs_max, duree_min, duree_max, age_min, complexite, description",
    )
    .eq("actif", true)
    .order("note", { ascending: false })
    .limit(limit);

  if (q.length >= 2) {
    query = query.ilike("nom", `%${q}%`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: "Impossible de charger les jeux." },
      { status: 500 },
    );
  }

  const jeux: MobileJeuListItem[] = (data ?? []).map((jeu) => ({
    slug: jeu.slug,
    nom: jeu.nom,
    note: jeu.note,
    imageUrl: jeu.image_url,
    joueursMin: jeu.joueurs_min,
    joueursMax: jeu.joueurs_max,
    dureeMin: jeu.duree_min,
    dureeMax: jeu.duree_max,
    ageMin: jeu.age_min,
    complexite: jeu.complexite,
    description: jeu.description,
  }));

  return NextResponse.json({ jeux });
}
