import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

const LOGIN_PATH  = "/gestion/login";
const PUBLIC_PATHS = [LOGIN_PATH];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow login page and any /api/gestion/* routes through (no auth required)
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-pathname", pathname);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }
  if (pathname.startsWith("/api/gestion/")) {
    return NextResponse.next();
  }

  // Verify session cookie
  const token  = req.cookies.get(SESSION_COOKIE)?.value ?? "";
  const email  = verifySessionToken(token);

  if (!email) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = LOGIN_PATH;
    loginUrl.search   = `?from=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated — forward pathname + identity as request headers
  // (readable via headers() in server components)
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);
  requestHeaders.set("x-admin-email", email);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/gestion/:path*"],
};
