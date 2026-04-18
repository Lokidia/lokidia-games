import { NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase/service";
import { listSeoPages } from "@/lib/seo/repository";

export async function GET() {
  const sb = createServiceClient();

  const [jeuxRes, catsRes, recentRes, seoPages] = await Promise.all([
    sb.from("jeux").select("*", { count: "exact", head: true }),
    sb.from("categories").select("*", { count: "exact", head: true }),
    sb.from("jeux").select("slug, nom, updated_at").order("updated_at", { ascending: false }).limit(5),
    listSeoPages(),
  ]);

  const nbSeoGenerated = seoPages.filter((p) =>
    ["generated", "published"].includes(p.status),
  ).length;

  return NextResponse.json({
    nbJeux: jeuxRes.count ?? 0,
    nbCategories: catsRes.count ?? 0,
    nbSeoTotal: seoPages.length,
    nbSeoGenerated,
    recentJeux: recentRes.data ?? [],
  });
}
