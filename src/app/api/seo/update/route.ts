import { NextRequest, NextResponse } from "next/server";
import { findSeoPageBySlug, upsertSeoPage } from "@/lib/seo/repository";
import type { SeoPage } from "@/lib/seo/types";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  const record = await findSeoPageBySlug(slug);
  if (!record) return NextResponse.json({ error: `No record for slug: ${slug}` }, { status: 404 });

  return NextResponse.json(record);
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json() as { slug: string; payload: Partial<SeoPage> };
    const { slug, payload } = body;

    if (!slug || !payload) {
      return NextResponse.json({ error: "slug and payload required" }, { status: 400 });
    }

    const existing = await findSeoPageBySlug(slug);
    if (!existing) {
      return NextResponse.json({ error: `No page found for slug: ${slug}` }, { status: 404 });
    }

    const updated = {
      ...existing,
      payload_json: { ...existing.payload_json, ...payload },
      status: "draft" as const,
      updated_at: new Date().toISOString(),
    };

    const saved = await upsertSeoPage(updated);
    return NextResponse.json(saved);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
