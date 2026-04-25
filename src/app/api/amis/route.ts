import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";

// GET /api/amis — friends list + pending requests
export async function GET() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const svc = createServiceClient();
  const { data, error } = await svc
    .from("amis")
    .select("id, statut, created_at, user_id, ami_id, profiles_user:user_id(pseudo), profiles_ami:ami_id(pseudo)")
    .or(`user_id.eq.${user.id},ami_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ amis: data ?? [] });
}

// POST /api/amis — send friend request by email or pseudo
export async function POST(req: NextRequest) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const email  = (body.email  as string | undefined)?.trim().toLowerCase();
  const pseudo = (body.pseudo as string | undefined)?.trim();

  if (!email && !pseudo) {
    return NextResponse.json({ error: "email ou pseudo requis" }, { status: 400 });
  }

  const svc = createServiceClient();

  type ProfileRow = { id: string; pseudo: string | null };

  // Find target user
  let tId: string | null = null;

  if (email) {
    const { data: authUsers } = await svc.auth.admin.listUsers({ perPage: 1000 });
    const targetAuth = authUsers?.users?.find(u => u.email?.toLowerCase() === email);
    if (!targetAuth) return NextResponse.json({ error: "Aucun utilisateur trouvé avec cet email" }, { status: 404 });
    const { data: p } = await svc.from("profiles").select("id, pseudo").eq("id", targetAuth.id).single();
    tId = (p as unknown as ProfileRow | null)?.id ?? null;
  } else if (pseudo) {
    const { data: p } = await svc.from("profiles").select("id, pseudo").eq("pseudo", pseudo).single();
    tId = (p as unknown as ProfileRow | null)?.id ?? null;
  }

  if (!tId) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  if (tId === user.id) return NextResponse.json({ error: "Vous ne pouvez pas vous ajouter vous-même" }, { status: 400 });

  // Check existing relation
  const { data: existingRows } = await svc
    .from("amis")
    .select("id")
    .or(`and(user_id.eq.${user.id},ami_id.eq.${tId}),and(user_id.eq.${tId},ami_id.eq.${user.id})`)
    .limit(1);

  if (existingRows && existingRows.length > 0) {
    return NextResponse.json({ error: "Demande déjà envoyée ou déjà amis" }, { status: 409 });
  }
  const { data: inserted, error: insertError } = await svc
    .from("amis")
    .insert({ user_id: user.id, ami_id: tId, statut: "en_attente" })
    .select()
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  return NextResponse.json({ ami: inserted }, { status: 201 });
}
