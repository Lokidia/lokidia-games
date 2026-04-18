import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

const LOGIN_PATH   = "/gestion/login";
const PUBLIC_PATHS = [LOGIN_PATH];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Pass login page and API auth routes through without cookie check
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-pathname", pathname);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }
  if (pathname.startsWith("/api/gestion/")) {
    return NextResponse.next();
  }

  // Verify signed session cookie
  const token = req.cookies.get(SESSION_COOKIE)?.value ?? "";
  const email = await verifySessionToken(token);

  if (!email) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = LOGIN_PATH;
    loginUrl.search   = `?from=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated — forward pathname + identity as request headers
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);
  requestHeaders.set("x-admin-email", email);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/gestion/:path*"],
};
