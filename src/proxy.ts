import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/config";

/**
 * Keeps the Supabase session cookie fresh for the dashboard and turns signed-out visitors away
 * before any admin page renders. This is an optimistic check only: every admin page and
 * Server Action verifies the user again, and Row Level Security enforces it in the database.
 */
export async function proxy(request: NextRequest) {
  const url = SUPABASE_URL;
  const key = SUPABASE_KEY;
  if (!url || !key) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Validates the JWT (and refreshes it if needed). Do not run code between client creation and this call.
  // If Supabase is slow or unreachable, let the request through rather than failing the page:
  // the dashboard layout checks the session again on the server, and RLS protects the data.
  let signedIn: boolean;
  try {
    const result = await Promise.race([
      supabase.auth.getClaims(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000)),
    ]);
    if (result === null) return response;
    signedIn = Boolean(result.data?.claims?.sub);
  } catch {
    return response;
  }

  const { pathname } = request.nextUrl;
  const isPublicAdminPage = pathname === "/admin/login";

  if (!signedIn && !isPublicAdminPage) {
    const login = request.nextUrl.clone();
    login.pathname = "/admin/login";
    login.search = pathname !== "/admin" ? `?next=${encodeURIComponent(pathname)}` : "";
    const redirect = NextResponse.redirect(login);
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }

  return response;
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
