"use client";
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL } from "../config";

let client: SupabaseClient | undefined;

/** Browser client for the admin area. Sessions live in cookies so the server and proxy can read them. */
export function getBrowserClient() {
  client ??= createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
  return client;
}
