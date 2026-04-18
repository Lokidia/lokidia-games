import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SeoPageTemplate from "@/components/SeoPageTemplate";
import { resolveSeoRoute } from "@/lib/seo/catalog";
import { getOrCreateSeoPage } from "@/lib/seo/service";
import { SeoRouteParams } from "@/lib/seo/types";

// Deduplicate within a single request (generateMetadata + page component both call this)
const loadSeoPage = cache(async (params: SeoRouteParams) => {
  const route = resolveSeoRoute(params);

  if (!route.valid || !params.genre) {
    return { route, record: null };
  }

  const record = await getOrCreateSeoPage({
    genre: params.genre,
    joueurs: params.joueurs,
    duree: params.duree,
  });

  return { route, record };
});

export async function buildSeoRouteMetadata(params: SeoRouteParams): Promise<Metadata> {
  const { route, record } = await loadSeoPage(params);

  if (!route.valid || !record) {
    return {
      title: "Page introuvable",
      robots: { index: false, follow: false },
    };
  }

  const { title, meta } = record.payload_json;

  return {
    title,
    description: meta,
    alternates: { canonical: route.url },
    robots: { index: route.indexable, follow: true },
    openGraph: {
      title,
      description: meta,
      url: route.url,
      locale: "fr_FR",
      type: "article",
    },
  };
}

export async function renderSeoRoutePage(params: SeoRouteParams) {
  const { route, record } = await loadSeoPage(params);

  if (!route.valid || !record) {
    notFound();
  }

  return <SeoPageTemplate page={record.payload_json} />;
}
