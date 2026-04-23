import { NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase/service";

// Returns all ASINs already published in jeux (extracted from jeux_prix amazon URLs)
export async function GET() {
  const sb = createServiceClient();
  const { data } = await sb
    .from("jeux_prix")
    .select("url")
    .eq("marchand", "amazon");

  const asins = new Set<string>();
  for (const row of data ?? []) {
    const match = (row.url as string).match(/\/dp\/([A-Z0-9]{10})/);
    if (match) asins.add(match[1]);
  }

  return NextResponse.json({ asins: [...asins] });
}
