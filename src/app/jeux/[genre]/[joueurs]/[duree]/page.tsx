import type { Metadata } from "next";
import { buildSeoRouteMetadata, renderSeoRoutePage } from "../../../_seo-page";

interface PageProps {
  params: Promise<{ genre: string; joueurs: string; duree: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { genre, joueurs, duree } = await params;
  return buildSeoRouteMetadata({ genre, joueurs, duree });
}

export default async function GenrePlayersDurationSeoPage({ params }: PageProps) {
  const { genre, joueurs, duree } = await params;
  return renderSeoRoutePage({ genre, joueurs, duree });
}
