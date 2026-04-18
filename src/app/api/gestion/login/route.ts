import { NextRequest, NextResponse } from "next/server";
import { checkCredentials, createSessionToken, SESSION_COOKIE } from "@/lib/session";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const email    = String(form.get("email")    ?? "").trim();
  const password = String(form.get("password") ?? "");
  const from     = String(form.get("from")     ?? "/gestion");

  if (!checkCredentials(email, password)) {
    // Redirect back to login with error flag
    const url = req.nextUrl.clone();
    url.pathname = "/gestion/login";
    url.search   = `?error=1&from=${encodeURIComponent(from)}`;
    return NextResponse.redirect(url, { status: 303 });
  }

  const token = createSessionToken(email);

  const destination = req.nextUrl.clone();
  destination.pathname = from.startsWith("/gestion") ? from : "/gestion";
  destination.search   = "";

  const res = NextResponse.redirect(destination, { status: 303 });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path:     "/gestion",
    maxAge:   8 * 60 * 60, // 8 hours in seconds
    // secure: true  — enable when behind HTTPS in production
  });

  return res;
}
