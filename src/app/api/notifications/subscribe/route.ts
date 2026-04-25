import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";

// POST /api/notifications/subscribe — save subscription
export async function POST(req: NextRequest) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const subscription = await req.json().catch(() => null);
  if (!subscription?.endpoint) {
    return NextResponse.json({ error: "subscription invalide" }, { status: 400 });
  }

  const svc = createServiceClient();
  const { error } = await svc
    .from("push_subscriptions")
    .upsert({ user_id: user.id, subscription }, { onConflict: "user_id,subscription->>'endpoint'" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE /api/notifications/subscribe — remove subscription
export async function DELETE(req: NextRequest) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const { endpoint } = await req.json().catch(() => ({}));

  const svc = createServiceClient();
  const query = svc.from("push_subscriptions").delete().eq("user_id", user.id);
  if (endpoint) query.eq("subscription->>endpoint", endpoint);
  await query;

  return NextResponse.json({ ok: true });
}
