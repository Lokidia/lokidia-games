import { NextResponse } from "next/server";
import { fetchBggNouveautes } from "@/tools/fetch-bgg-nouveautes";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const nouveautes = await fetchBggNouveautes();
    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      nouveautes,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
