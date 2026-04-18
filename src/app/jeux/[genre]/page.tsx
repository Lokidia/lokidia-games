import type { Metadata } from "next";
import { buildSeoRouteMetadata, renderSeoRoutePage } from "../_seo-page";

interface PageProps {
  params: Promise<{ genre: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { genre } = await params;
  return buildSeoRouteMetadata({ genre });
}

export default async function GenreSeoPage({ params }: PageProps) {
  const { genre } = await params;
  return renderSeoRoutePage({ genre });
}
