/** Public Supabase configuration. Both values are safe to expose to the browser. */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** When false, the public site renders the bundled sample collection instead. */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** Storage buckets (created by supabase/migrations). */
export const BUCKET_PUBLIC = "artworks"; // optimised display copies, thumbnails, site photographs
export const BUCKET_ORIGINALS = "artwork-originals"; // untouched originals, admins only

/** Image derivative sizes, measured on the long edge. */
export const DISPLAY_LONG_EDGE = 2560;
export const THUMB_LONG_EDGE = 960;
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
