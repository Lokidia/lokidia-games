import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

export async function POST(req: NextRequest) {
  const destination = req.nextUrl.clone();
  destination.pathname = "/gestion/login";
  destination.search   = "";

  const res = NextResponse.redirect(destination, { status: 303 });
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path:     "/gestion",
    maxAge:   0,
  });
  return res;
}
