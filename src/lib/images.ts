import { BUCKET_PUBLIC, DISPLAY_LONG_EDGE, SUPABASE_URL } from "./config";
import type { Artwork, FrameStyle } from "./types";

/** Resolve a stored path (or a bundled /samples path) to a URL. */
export function publicImageUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("/") || path.startsWith("http")) return path;
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_PUBLIC}/${path}`;
}

const PAPER_MEDIA = /(pencil|graphite|charcoal|ink|watercolou?r|gouache|pastel|chalk|drawing|on paper|etching|print)/i;

/** Oils and acrylics hang in gilt; works on paper get a walnut frame and ivory mount. */
export function resolveFrame(art: Pick<Artwork, "frame_style" | "medium">): Exclude<FrameStyle, "auto"> {
  if (art.frame_style && art.frame_style !== "auto") return art.frame_style;
  return art.medium && PAPER_MEDIA.test(art.medium) ? "paper" : "gilt";
}

export function aspect(art: Pick<Artwork, "width" | "height">) {
  return art.width > 0 && art.height > 0 ? art.width / art.height : 4 / 5;
}

/** Extra width/height the frame adds, as a fraction of the picture width. Used to keep framed works in proportion. */
export function frameAllowance(frame: Exclude<FrameStyle, "auto">) {
  switch (frame) {
    case "paper":
      return 0.25;
    case "gilt":
      return 0.11;
    case "walnut":
      return 0.07;
    default:
      return 0;
  }
}

/** Pixel size of the stored display copy (long edge capped at DISPLAY_LONG_EDGE). */
export function displaySize(art: Pick<Artwork, "width" | "height">) {
  const long = Math.max(art.width, art.height);
  const s = Math.min(1, DISPLAY_LONG_EDGE / long);
  return { width: Math.round(art.width * s), height: Math.round(art.height * s) };
}
