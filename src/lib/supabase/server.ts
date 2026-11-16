import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_KEY, SUPABASE_URL } from "../config";

/** Request-scoped client for Server Actions and Route Handlers. */
export async function createSessionClient() {
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a context that cannot set cookies; the proxy refreshes sessions instead.
        }
      },
    },
  });
}

/** Verifies the caller is a signed-in administrator. Throws otherwise. */
export async function requireAdmin() {
  const supabase = await createSessionClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) throw new Error("You need to sign in to do that.");
  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error || !isAdmin) throw new Error("This account is not an administrator.");
  return supabase;
}
