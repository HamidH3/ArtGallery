/** Public Supabase configuration. Both values are safe to expose to the browser. */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** When false, the public site runs in preview mode with empty frames. */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

/**
 * The site's public address, used for share links and the sitemap. A missing or mistyped value
 * never breaks the build: it falls back to the address Vercel assigns, then to localhost.
 */
export const SITE_URL = resolveSiteUrl();

function resolveSiteUrl() {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
  ];
  for (const raw of candidates) {
    const value = raw?.trim();
    if (!value) continue;
    try {
      const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
      if (url.hostname.includes(".") || url.hostname === "localhost") return url.origin;
    } catch {
      // not a usable address; try the next one
    }
  }
  return "http://localhost:3000";
}

/** Storage buckets (created by supabase/migrations). */
export const BUCKET_PUBLIC = "artworks"; // optimised display copies, thumbnails, site photographs
export const BUCKET_ORIGINALS = "artwork-originals"; // untouched originals, admins only

/** Image derivative sizes, measured on the long edge. */
export const DISPLAY_LONG_EDGE = 2560;
export const THUMB_LONG_EDGE = 960;
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;