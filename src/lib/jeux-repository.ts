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
  image_url: string | null;
  jeux_prix: { marchand: string; url: string; prix: string }[];
  jeux_categories: { categories: { nom: string } | null }[];
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
    imageUrl:    row.image_url ?? "",
    categories:  (row.jeux_categories ?? []).map((jc) => jc.categories?.nom ?? "").filter(Boolean),
    acheter:     prix as AcheterJeu,
  };
}

const JEUX_SELECT = `
  id, slug, nom, annee, description,
  joueurs_min, joueurs_max, duree_min, duree_max, age_min,
  complexite, note, mecaniques, regles, image_url,
  jeux_prix(marchand, url, prix),
  jeux_categories(categories(nom))
`;

export async function getAllJeux(): Promise<Jeu[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("jeux")
      .select(JEUX_SELECT)
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
      .single();

    if (catErr || !cat) return { jeux: [], categorie: null };
    const catInfo = cat as CategorieInfo;

    const { data: assoc } = await supabase
      .from("jeux_categories")
      .select("jeu_id")
      .eq("categorie_id", catInfo.id);

    const jeuIds = (assoc ?? []).map((a: { jeu_id: string }) => a.jeu_id);
    if (jeuIds.length === 0) return { jeux: [], categorie: catInfo };

    const { data, error } = await supabase
      .from("jeux")
      .select(JEUX_SELECT)
      .in("id", jeuIds)
      .order("nom");

    if (error || !data) throw error ?? new Error("empty");
    return { jeux: (data as unknown as SupabaseJeu[]).map(toJeu), categorie: catInfo };
  } catch {
    return { jeux: [], categorie: null };
  }
}
