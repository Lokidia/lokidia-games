import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";

// PATCH /api/amis/[id] — accept or refuse request (recipient only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const statut = body.statut as "accepte" | "refuse";

  if (!["accepte", "refuse"].includes(statut)) {
    return NextResponse.json({ error: "statut invalide" }, { status: 400 });
  }

  const svc = createServiceClient();
  const { data: row } = await svc.from("amis").select("ami_id").eq("id", id).single();
  if (!row || (row as { ami_id: string }).ami_id !== user.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { error } = await svc.from("amis").update({ statut }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE /api/amis/[id] — cancel request or remove friend (sender only)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const { id } = await params;
  const svc = createServiceClient();
  const { data: row } = await svc.from("amis").select("user_id, ami_id").eq("id", id).single();
  if (!row) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const r = row as { user_id: string; ami_id: string };
  if (r.user_id !== user.id && r.ami_id !== user.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  await svc.from("amis").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
