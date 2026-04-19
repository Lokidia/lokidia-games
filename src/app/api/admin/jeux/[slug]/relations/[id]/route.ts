import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase/service";

type Params = { params: Promise<{ slug: string; id: string }> };

/* DELETE — remove a relation by id */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const sb = createServiceClient();

  const { error } = await sb.from("jeux_relations").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return new NextResponse(null, { status: 204 });
}
