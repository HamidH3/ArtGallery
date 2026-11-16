import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { isSupabaseConfigured } from "./config";
import { defaultAbout, defaultSettings, previewArtworks } from "./preview-data";
import { createPublicClient } from "./supabase/public";
import type { AboutSection, Artwork, SiteSettings } from "./types";

/** Every public read is tagged with this; admin saves call updateTag(GALLERY_TAG). */
export const GALLERY_TAG = "gallery";

/** Published artworks in hanging order. Public RLS only ever returns published rows. */
export async function getArtworks(): Promise<Artwork[]> {
  "use cache";
  cacheTag(GALLERY_TAG);
  cacheLife("hours");
  if (!isSupabaseConfigured) return previewArtworks;

  const { data, error } = await createPublicClient()
    .from("artworks")
    .select("*")
    .eq("is_published", true)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[gallery] could not load artworks:", error.message);
    return [];
  }
  return (data ?? []) as Artwork[];
}

export async function getArtworkBySlug(slug: string): Promise<Artwork | null> {
  const works = await getArtworks();
  return works.find((w) => w.slug === slug) ?? null;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  "use cache";
  cacheTag(GALLERY_TAG);
  cacheLife("hours");
  if (!isSupabaseConfigured) return defaultSettings;

  const { data, error } = await createPublicClient().from("site_settings").select("*").eq("id", 1).maybeSingle();
  if (error || !data) {
    if (error) console.error("[gallery] could not load site settings:", error.message);
    return defaultSettings;
  }
  return { ...defaultSettings, ...(stripNulls(data) as Partial<SiteSettings>) };
}

export async function getAboutSections(): Promise<AboutSection[]> {
  "use cache";
  cacheTag(GALLERY_TAG);
  cacheLife("hours");
  if (!isSupabaseConfigured) return defaultAbout;

  const { data, error } = await createPublicClient()
    .from("about_sections")
    .select("*")
    .order("display_order", { ascending: true });
  if (error) {
    console.error("[gallery] could not load about sections:", error.message);
    return [];
  }
  return (data ?? []) as AboutSection[];
}

/** The current year, resolved inside a cache scope so prerendering stays deterministic. */
export async function getCopyrightYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

/** Keep defaults for required text fields the admin left empty, but allow optional links to be cleared. */
function stripNulls(row: Record<string, unknown>) {
  const optional = new Set([
    "contact_email",
    "instagram_url",
    "extra_link_label",
    "extra_link_url",
    "about_portrait_path",
    "about_portrait_caption",
    "about_portrait_width",
    "about_portrait_height",
  ]);
  return Object.fromEntries(
    Object.entries(row).filter(([k, v]) => optional.has(k) || (v !== null && v !== "")),
  );
}
