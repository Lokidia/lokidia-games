import type { Metadata } from "next";
import { buildSeoRouteMetadata, renderSeoRoutePage } from "../../_seo-page";

interface PageProps {
  params: Promise<{ genre: string; joueurs: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { genre, joueurs } = await params;
  return buildSeoRouteMetadata({ genre, joueurs });
}

export default async function GenrePlayersSeoPage({ params }: PageProps) {
  const { genre, joueurs } = await params;
  return renderSeoRoutePage({ genre, joueurs });
}
