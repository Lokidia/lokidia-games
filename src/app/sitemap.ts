import { MetadataRoute } from "next";
import { createServiceClient } from "@/utils/supabase/service";
import { listSeoPages } from "@/lib/seo/repository";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://lokidia.com").replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sb = createServiceClient();

  const [seoRecords, { data: jeux }] = await Promise.all([
    listSeoPages(),
    sb
      .from("jeux")
      .select("slug, updated_at")
      .eq("actif", true)
      .order("slug"),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/jeux`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/chatbot`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  const gameRoutes: MetadataRoute.Sitemap = (jeux ?? []).map((jeu) => ({
    url: `${SITE_URL}/jeu/${jeu.slug}`,
    lastModified: jeu.updated_at ? new Date(jeu.updated_at) : new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const seoRoutes: MetadataRoute.Sitemap = seoRecords
    .filter((r) => r.status === "generated" || r.status === "published")
    .map((r) => ({
      url: `${SITE_URL}${r.payload_json.url}`,
      lastModified: new Date(r.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

  return [...staticRoutes, ...gameRoutes, ...seoRoutes];
}
