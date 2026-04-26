import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";
import { jeux as jeuxFallback, getJeuBySlug as getJeuBySlugFallback } from "@/data/jeux";
import type { Jeu, AcheterJeu, Complexite } from "@/types/jeu";

type SupabaseJeu = {
  id: string;
  slug: string;
  nom: string;
  annee: number;
  description: string;
  joueurs_min: number;
  joueurs_max: number;
  duree_min: number;
  duree_max: number;
  age_min: number;
  complexite: string;
  note: number;
  mecaniques: string[];
  regles: string[];
  points_forts: string[] | null;
  image_url: string | null;
  spotify_playlist_id: string | null;
  youtube_id: string | null;
  jeux_prix: { marchand: string; url: string; prix: string }[];
  jeux_categories: { categories: { nom: string; slug: string; spotify_playlist_id: string | null } | null }[];
};

function toJeu(row: SupabaseJeu): Jeu {
  const prix: Record<string, { url: string; prix: string }> = {
    amazon:    { url: "", prix: "" },
    philibert: { url: "", prix: "" },
    cultura:   { url: "", prix: "" },
    fnac:      { url: "", prix: "" },
  };
  for (const p of row.jeux_prix ?? []) {
    if (p.marchand in prix) prix[p.marchand] = { url: p.url, prix: p.prix };
  }

  return {
    id:          row.id,
    slug:        row.slug,
    nom:         row.nom,
    annee:       row.annee,
    description: row.description,
    joueursMin:  row.joueurs_min,
    joueursMax:  row.joueurs_max,
    dureeMin:    row.duree_min,
    dureeMax:    row.duree_max,
    ageMin:      row.age_min,
    complexite:  row.complexite as Complexite,
    note:        row.note,
    mecaniques:  row.mecaniques ?? [],
    regles:      row.regles ?? [],
    pointsForts: row.points_forts ?? [],
    imageUrl:    row.image_url ?? "",
    categories:  (row.jeux_categories ?? []).map((jc) => jc.categories?.nom ?? "").filter(Boolean),
    categoryLinks: (row.jeux_categories ?? [])
      .filter((jc) => jc.categories?.nom && jc.categories?.slug)
      .map((jc) => ({ nom: jc.categories!.nom, slug: jc.categories!.slug })),
    acheter: prix as unknown as AcheterJeu,
    spotifyPlaylistId: row.spotify_playlist_id ?? null,
    categorySpotifyPlaylistId:
      (row.jeux_categories ?? []).find((jc) => jc.categories?.spotify_playlist_id)
        ?.categories?.spotify_playlist_id ?? null,
    youtubeId: row.youtube_id ?? null,
  };
}

const JEUX_SELECT = `
  id, slug, nom, annee, description,
  joueurs_min, joueurs_max, duree_min, duree_max, age_min,
  complexite, note, mecaniques, regles, points_forts, image_url, spotify_playlist_id, youtube_id,
  jeux_prix(marchand, url, prix),
  jeux_categories(categories(nom, slug, spotify_playlist_id))
`;

export async function getAllJeux(): Promise<Jeu[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("jeux")
      .select(JEUX_SELECT)
      .eq("actif", true)
      .order("nom");

    if (error || !data) throw error ?? new Error("empty");
    return (data as unknown as SupabaseJeu[]).map(toJeu);
  } catch {
    return jeuxFallback;
  }
}

export async function getJeuxBySlugs(slugs: string[]): Promise<Jeu[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("jeux")
      .select(JEUX_SELECT)
      .in("slug", slugs);

    if (error || !data) throw error ?? new Error("empty");

    const rows = (data as unknown as SupabaseJeu[]).map(toJeu);
    return slugs
      .map((s) => rows.find((j) => j.slug === s))
      .filter((j): j is Jeu => j !== undefined);
  } catch {
    return slugs
      .map((s) => jeuxFallback.find((j) => j.slug === s))
      .filter((j): j is Jeu => j !== undefined);
  }
}

export async function getJeuBySlug(slug: string): Promise<Jeu | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("jeux")
      .select(JEUX_SELECT)
      .eq("slug", slug)
      .single();

    if (error || !data) throw error ?? new Error("empty");
    return toJeu(data as unknown as SupabaseJeu);
  } catch {
    return getJeuBySlugFallback(slug) ?? null;
  }
}

export async function getAllJeuxSlugs(): Promise<string[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("jeux").select("slug");
    if (error || !data) throw error ?? new Error("empty");
    return (data as { slug: string }[]).map((r) => r.slug);
  } catch {
    return jeuxFallback.map((j) => j.slug);
  }
}

export interface CategorieInfo {
  id: string;
  slug: string;
  nom: string;
  parent_id: string | null;
}

export async function getMenuCategories(): Promise<CategorieInfo[]> {
  try {
    // Service client: no cookies() dependency, safe at build time and in layouts
    const sb = createServiceClient();
    const { data, error } = await sb
      .from("categories")
      .select("id, slug, nom, parent_id")
      .eq("actif", true)
      .order("position", { nullsFirst: false })
      .order("nom");
    if (error || !data) throw error ?? new Error("empty");
    return data as CategorieInfo[];
  } catch {
    return [];
  }
}

export async function getJeuxByCategorie(catSlug: string): Promise<{
  jeux: Jeu[];
  categorie: CategorieInfo | null;
}> {
  try {
    const supabase = await createClient();

    const { data: cat, error: catErr } = await supabase
      .from("categories")
      .select("id, slug, nom, parent_id")
      .eq("slug", catSlug)
      .eq("actif", true)
      .single();

    if (catErr || !cat) return { jeux: [], categorie: null };
    const catInfo = cat as CategorieInfo;

    // Collect IDs: the category itself + all active child categories
    const { data: children } = await supabase
      .from("categories")
      .select("id")
      .eq("parent_id", catInfo.id)
      .eq("actif", true);

    const catIds = [catInfo.id, ...(children ?? []).map((c: { id: string }) => c.id)];

    const { data: assoc } = await supabase
      .from("jeux_categories")
      .select("jeu_id")
      .in("categorie_id", catIds);

    const jeuIds = [...new Set((assoc ?? []).map((a: { jeu_id: string }) => a.jeu_id))];
    if (jeuIds.length === 0) return { jeux: [], categorie: catInfo };

    const { data, error } = await supabase
      .from("jeux")
      .select(JEUX_SELECT)
      .in("id", jeuIds)
      .eq("actif", true)
      .order("nom");

    if (error || !data) throw error ?? new Error("empty");
    return { jeux: (data as unknown as SupabaseJeu[]).map(toJeu), categorie: catInfo };
  } catch {
    return { jeux: [], categorie: null };
  }
}
