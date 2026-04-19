import { NextRequest, NextResponse } from "next/server";
import { updateSeoRecordSupabase } from "@/lib/seo/supabase-repository";
import type { SeoPage } from "@/lib/seo/types";

export async function PUT(req: NextRequest) {
  try {
    const body = (await req.json()) as { slug: string; payload: Partial<SeoPage> };
    const { slug, payload } = body;

    if (!slug || !payload) {
      return NextResponse.json({ error: "slug and payload required" }, { status: 400 });
    }

    const updated = await updateSeoRecordSupabase(slug, payload);
    if (!updated) {
      return NextResponse.json({ error: `No record found for slug: ${slug}` }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
