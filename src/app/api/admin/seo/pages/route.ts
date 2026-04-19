import { NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase/service";
import { listAllSeoRecordsSupabase, urlToSlug } from "@/lib/seo/supabase-repository";

export const dynamic = "force-dynamic";

const STATIC_PAGES = [
  { url: "/",                   label: "Accueil",                      description: "Page d'accueil de l'encyclopédie des jeux de société Lokidia Games" },
  { url: "/jeux",               label: "Tous les jeux",                description: "Catalogue complet des jeux de société référencés sur Lokidia Games" },
  { url: "/chatbot",            label: "Recommandations chatbot",       description: "Outil de recommandation de jeux de société par IA" },
  { url: "/a-propos",           label: "À propos",                     description: "Présentation de Lokidia Games et de son équipe" },
  { url: "/contact",            label: "Contact",                      description: "Formulaire de contact Lokidia Games" },
  { url: "/mentions-legales",   label: "Mentions légales",             description: "Mentions légales du site Lokidia Games" },
  { url: "/confidentialite",    label: "Politique de confidentialité", description: "Politique de confidentialité et protection des données RGPD" },
  { url: "/cgu",                label: "CGU",                          description: "Conditions générales d'utilisation de Lokidia Games" },
];

export interface SiteUrlItem {
  url: string;
  label: string;
  type: "static" | "category" | "game";
  context: Record<string, unknown>;
  record: {
    slug: string;
    status: string;
    generated_at: string;
    updated_at: string;
    payload_json: {
      title?: string;
      meta?: string;
      h1?: string;
      intro?: string;
      sections?: unknown[];
    };
  } | null;
}

export async function GET() {
  const sb = createServiceClient();

  const [seoRecords, { data: categories }, { data: games }] = await Promise.all([
    listAllSeoRecordsSupabase(),
    sb.from("categories").select("slug, nom").eq("actif", true).order("nom"),
    sb
      .from("jeux")
      .select("slug, nom, description, joueurs_min, joueurs_max, duree_min, duree_max, age_min, complexite, mecaniques")
      .eq("actif", true)
      .order("nom"),
  ]);

  const bySlug = new Map(seoRecords.map((r) => [r.slug, r]));

  function recordSummary(url: string) {
    const r = bySlug.get(urlToSlug(url));
    if (!r) return null;
    const p = r.payload_json;
    return {
      slug: r.slug,
      status: r.status,
      generated_at: r.generated_at,
      updated_at: r.updated_at,
      payload_json: {
        title: p.title,
        meta: p.meta,
        h1: p.h1,
        intro: p.intro,
        sections: p.sections,
      },
    };
  }

  const staticItems: SiteUrlItem[] = STATIC_PAGES.map((p) => ({
    url: p.url,
    label: p.label,
    type: "static",
    context: { description: p.description },
    record: recordSummary(p.url),
  }));

  const categoryItems: SiteUrlItem[] = (categories ?? []).map((c: { slug: string; nom: string }) => {
    const url = `/jeux/categorie/${c.slug}`;
    return {
      url,
      label: c.nom,
      type: "category",
      context: { nom: c.nom },
      record: recordSummary(url),
    };
  });

  const gameItems: SiteUrlItem[] = (
    games as Array<{
      slug: string; nom: string; description: string;
      joueurs_min: number; joueurs_max: number;
      duree_min: number; duree_max: number;
      age_min: number; complexite: string; mecaniques: string[];
    }> ?? []
  ).map((g) => {
    const url = `/jeu/${g.slug}`;
    return {
      url,
      label: g.nom,
      type: "game",
      context: {
        nom: g.nom,
        description: g.description ?? "",
        joueurs_min: g.joueurs_min,
        joueurs_max: g.joueurs_max,
        duree_min: g.duree_min,
        duree_max: g.duree_max,
        age_min: g.age_min,
        complexite: g.complexite,
        mecaniques: g.mecaniques ?? [],
      },
      record: recordSummary(url),
    };
  });

  const total = staticItems.length + categoryItems.length + gameItems.length;
  const enriched = [...staticItems, ...categoryItems, ...gameItems].filter((i) => i.record !== null).length;

  return NextResponse.json({
    static: staticItems,
    categories: categoryItems,
    games: gameItems,
    stats: { total, enriched },
  });
}
