import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase/service";

// GET a single staging item (with data_brute for preview)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("jeux_staging")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return NextResponse.json({ error: "introuvable" }, { status: 404 });
  return NextResponse.json({ item: data });
}

// PATCH statut (reject / restore)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const statut = body.statut as string | undefined;

  if (!statut || !["en_attente", "approuve", "rejete"].includes(statut)) {
    return NextResponse.json({ error: "statut invalide" }, { status: 400 });
  }

  const sb = createServiceClient();
  const { error } = await sb.from("jeux_staging").update({ statut }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
