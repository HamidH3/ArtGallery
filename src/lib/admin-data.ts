import "server-only";
import { isSupabaseConfigured } from "./config";
import { defaultSettings } from "./preview-data";
import { createSessionClient } from "./supabase/server";
import type { AboutSection, Artwork, SiteSettings } from "./types";

export type AdminState =
  | { status: "unconfigured" }
  | { status: "unavailable" }
  | { status: "signed-out" }
  | { status: "not-admin"; email: string | null }
  | { status: "admin"; email: string | null; userId: string };

/** Who is looking at the dashboard. Reads the session cookie, so call it inside a Suspense boundary. */
export async function getAdminState(): Promise<AdminState> {
  if (!isSupabaseConfigured) return { status: "unconfigured" };
  // Never leave the dashboard waiting on a slow connection to Supabase.
  return Promise.race([
    checkAdmin(),
    new Promise<AdminState>((resolve) => setTimeout(() => resolve({ status: "unavailable" }), 8000)),
  ]);
}

async function checkAdmin(): Promise<AdminState> {
  try {
    const supabase = await createSessionClient();
    const { data } = await supabase.auth.getClaims();
    const claims = data?.claims;
    if (!claims?.sub) return { status: "signed-out" };
    const email = typeof claims.email === "string" ? claims.email : null;
    const { data: isAdmin, error } = await supabase.rpc("is_admin");
    if (error) return { status: "unavailable" };
    return isAdmin ? { status: "admin", email, userId: claims.sub } : { status: "not-admin", email };
  } catch {
    return { status: "unavailable" };
  }
}

/** Every artwork, including unpublished ones (RLS allows this for admins only). */
export async function getAllArtworks(): Promise<Artwork[]> {
  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("artworks")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load the collection: ${error.message}`);
  return (data ?? []) as Artwork[];
}

export async function getArtworkById(id: string): Promise<Artwork | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createSessionClient();
  const { data } = await supabase.from("artworks").select("*").eq("id", id).maybeSingle();
  return (data as Artwork | null) ?? null;
}

export async function getSettingsForEdit(): Promise<SiteSettings> {
  const supabase = await createSessionClient();
  const { data } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
  return { ...defaultSettings, ...((data ?? {}) as Partial<SiteSettings>) };
}

export async function getAboutForEdit(): Promise<AboutSection[]> {
  const supabase = await createSessionClient();
  const { data, error } = await supabase.from("about_sections").select("*").order("display_order", { ascending: true });
  if (error) throw new Error(`Could not load the About page: ${error.message}`);
  return (data ?? []) as AboutSection[];
}
