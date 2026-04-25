import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";

// GET /api/parties — list parties for current user
export async function GET() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const svc = createServiceClient();
  const { data, error } = await svc
    .from("parties")
    .select("id, date_partie, duree_minutes, notes, joueurs, gagnant_id, createur_id, jeux(slug, nom, image_url)")
    .or(`createur_id.eq.${user.id},joueurs.cs.{${user.id}}`)
    .order("date_partie", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ parties: data ?? [] });
}

// POST /api/parties — create a new session
export async function POST(req: NextRequest) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { jeu_id, date_partie, duree_minutes, gagnant_id, joueurs, notes } = body as {
    jeu_id?: string;
    date_partie?: string;
    duree_minutes?: number;
    gagnant_id?: string;
    joueurs?: string[];
    notes?: string;
  };

  if (!date_partie) {
    return NextResponse.json({ error: "date_partie requise" }, { status: 400 });
  }

  const allJoueurs = Array.from(new Set([user.id, ...(joueurs ?? [])]));

  const svc = createServiceClient();
  const { data: inserted, error } = await svc
    .from("parties")
    .insert({
      createur_id: user.id,
      jeu_id: jeu_id ?? null,
      date_partie,
      duree_minutes: duree_minutes ?? null,
      gagnant_id: gagnant_id ?? null,
      joueurs: allJoueurs,
      notes: notes ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ partie: inserted }, { status: 201 });
}
