import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

const LOGIN_PATH = "/gestion/login";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── 1. Refresh Supabase session for every request ────────────────────────
  // Must be done first so cookies are always up-to-date.
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  await supabase.auth.getUser();

  // ── 2. Admin guard for /gestion routes ───────────────────────────────────
  if (pathname.startsWith("/gestion")) {
    // Login page and internal gestion API: pass through (no redirect loop)
    if (pathname.startsWith(LOGIN_PATH) || pathname.startsWith("/api/gestion/")) {
      const headers = new Headers(request.headers);
      headers.set("x-pathname", pathname);
      const res = NextResponse.next({ request: { headers } });
      supabaseResponse.cookies.getAll().forEach(({ name, value }) => res.cookies.set(name, value));
      return res;
    }

    // Verify signed admin session cookie
    const token = request.cookies.get(SESSION_COOKIE)?.value ?? "";
    const email = await verifySessionToken(token);

    if (!email) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = LOGIN_PATH;
      loginUrl.search = `?from=${encodeURIComponent(pathname)}`;
      return NextResponse.redirect(loginUrl);
    }

    // Authenticated admin — forward identity headers
    const headers = new Headers(request.headers);
    headers.set("x-pathname", pathname);
    headers.set("x-admin-email", email);
    const res = NextResponse.next({ request: { headers } });
    supabaseResponse.cookies.getAll().forEach(({ name, value }) => res.cookies.set(name, value));
    return res;
  }

  // ── 3. All other routes: return Supabase response with refreshed cookies ─
  return supabaseResponse;
}

export const config = {
  matcher: [
    // Run on every path except Next.js internals and static assets
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
