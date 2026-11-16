import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL } from "../config";

/**
 * Cookie-less client for public, cacheable reads.
 * It uses the publishable (anon) key, so Row Level Security decides what it can see.
 */
export function createPublicClient() {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
