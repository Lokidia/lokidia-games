import { NextRequest, NextResponse } from "next/server";
import { getOrCreateSeoPage } from "@/lib/seo/service";
import { SeoGenerationInput } from "@/lib/seo/types";

function parseBody(body: unknown): SeoGenerationInput {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid request body");
  }

  const payload = body as Record<string, unknown>;
  const genre = payload.genre;

  if (typeof genre !== "string" || !genre.trim()) {
    throw new Error('Missing or invalid field "genre"');
  }

  const normalizeOptional = (value: unknown): string | undefined => {
    if (typeof value !== "string") {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed || undefined;
  };

  return {
    genre: genre.trim(),
    joueurs: normalizeOptional(payload.joueurs),
    duree: normalizeOptional(payload.duree),
    niveau: normalizeOptional(payload.niveau),
    cible: normalizeOptional(payload.cible),
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = parseBody(body);
    const record = await getOrCreateSeoPage(input);

    return NextResponse.json(record);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown SEO generation error";

    return NextResponse.json(
      { error: message },
      { status: 400 },
    );
  }
}
