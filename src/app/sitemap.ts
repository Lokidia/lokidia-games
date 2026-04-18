import { MetadataRoute } from "next";
import { jeux } from "@/data/jeux";
import { listSeoPages } from "@/lib/seo/repository";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://lokidia.com").replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const seoRecords = await listSeoPages();

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

  const gameRoutes: MetadataRoute.Sitemap = jeux.map((jeu) => ({
    url: `${SITE_URL}/jeu/${jeu.slug}`,
    lastModified: new Date(),
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
