import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createSessionClient } from "@/lib/supabase/server";

/**
 * Where links in Supabase emails land (password reset, invitations, email confirmation).
 * Supports both the token-hash links recommended in the README and PKCE `?code=` links.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/admin";
  // Only allow redirects inside the dashboard.
  const next = nextParam.startsWith("/admin") ? nextParam : "/admin";

  const supabase = await createSessionClient();
  let error: { message: string } | null = null;

  if (tokenHash && type) {
    ({ error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash }));
  } else if (code) {
    ({ error } = await supabase.auth.exchangeCodeForSession(code));
  } else {
    error = { message: "This link is missing its sign-in token." };
  }

  if (error) {
    const login = new URL("/admin/login", origin);
    login.searchParams.set("error", "The link has expired or was already used. Request a new one below.");
    return NextResponse.redirect(login);
  }

  const destination = type === "recovery" || type === "invite" ? "/admin/update-password" : next;
  return NextResponse.redirect(new URL(destination, origin));
}
