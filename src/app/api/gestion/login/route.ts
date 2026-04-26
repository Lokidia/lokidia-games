import { NextRequest, NextResponse } from "next/server";
import { checkCredentials, createSessionToken, SESSION_COOKIE } from "@/lib/session";

export async function POST(req: NextRequest) {
  const form     = await req.formData();
  const email    = String(form.get("email")    ?? "").trim();
  const password = String(form.get("password") ?? "");
  const from     = String(form.get("from")     ?? "/gestion");

  const valid = await checkCredentials(email, password);

  if (!valid) {
    const url = req.nextUrl.clone();
    url.pathname = "/gestion/login";
    url.search   = `?error=1&from=${encodeURIComponent(from)}`;
    return NextResponse.redirect(url, { status: 303 });
  }

  const token = await createSessionToken(email);

  const destination = req.nextUrl.clone();
  destination.pathname = from.startsWith("/gestion") && !from.startsWith("/gestion/login")
    ? from
    : "/gestion";
  destination.search = "";

  const res = NextResponse.redirect(destination, { status: 303 });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path:     "/",
    maxAge:   8 * 60 * 60,
    secure:   process.env.NODE_ENV === "production",
  });

  return res;
}
