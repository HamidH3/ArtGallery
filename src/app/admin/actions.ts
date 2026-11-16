"use server";

import { updateTag } from "next/cache";
import { BUCKET_ORIGINALS, BUCKET_PUBLIC } from "@/lib/config";
import { GALLERY_TAG } from "@/lib/data";
import { slugify } from "@/lib/format";
import { requireAdmin } from "@/lib/supabase/server";
import type { AboutSectionKind, FrameStyle, SiteSettings } from "@/lib/types";

export type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FRAMES: FrameStyle[] = ["auto", "gilt", "walnut", "paper", "none"];

function fail(error: unknown): { ok: false; error: string } {
  const message = error instanceof Error ? error.message : String(error);
  return { ok: false, error: message };
}

function text(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t) return null;
  return t.slice(0, max);
}

/** Storage paths created by the dashboard are "<uuid>/<file>" or "about/<file>": nothing else is accepted. */
function safePath(v: unknown): string | null {
  if (typeof v !== "string" || !v) return null;
  return /^(?:[0-9a-f-]{36}|about)\/[A-Za-z0-9._-]{1,160}$/.test(v) ? v : null;
}

// ---------------------------------------------------------------------------------------------
//  Artworks
// ---------------------------------------------------------------------------------------------

export interface ArtworkInput {
  id: string;
  isNew: boolean;
  title: string;
  description: string;
  year: number | null;
  medium: string;
  dimensions: string;
  alt_text: string;
  frame_style: FrameStyle;
  is_featured: boolean;
  is_published: boolean;
  /** Present only when a new image was uploaded. */
  image?: {
    image_path: string;
    thumbnail_path: string;
    original_path: string | null;
    width: number;
    height: number;
    blur_data_url: string | null;
    dominant_color: string | null;
  };
}

export async function saveArtwork(input: ArtworkInput): Promise<ActionResult<{ id: string; slug: string }>> {
  try {
    const supabase = await requireAdmin();
    if (!UUID.test(input.id)) throw new Error("That artwork reference isn't valid.");

    const title = text(input.title, 200);
    if (!title) throw new Error("Give the painting a title.");
    const year =
      input.year === null || input.year === undefined
        ? null
        : Number.isInteger(input.year) && input.year >= 1000 && input.year <= 2200
          ? input.year
          : null;
    const frame = FRAMES.includes(input.frame_style) ? input.frame_style : "auto";

    const row: Record<string, unknown> = {
      title,
      description: text(input.description, 5000),
      year,
      medium: text(input.medium, 200),
      dimensions: text(input.dimensions, 120),
      alt_text: text(input.alt_text, 500),
      frame_style: frame,
      is_featured: Boolean(input.is_featured),
      is_published: Boolean(input.is_published),
    };

    let previous: { image_path: string; thumbnail_path: string | null; original_path: string | null; slug: string } | null = null;
    if (!input.isNew) {
      const { data } = await supabase
        .from("artworks")
        .select("image_path, thumbnail_path, original_path, slug")
        .eq("id", input.id)
        .maybeSingle();
      if (!data) throw new Error("This painting no longer exists. It may have been deleted.");
      previous = data;
    }

    if (input.image) {
      const img = input.image;
      const image_path = safePath(img.image_path);
      const thumbnail_path = safePath(img.thumbnail_path);
      const original_path = img.original_path ? safePath(img.original_path) : null;
      if (!image_path || !thumbnail_path || (img.original_path && !original_path)) throw new Error("The uploaded image paths are invalid.");
      if (!(img.width > 0 && img.height > 0)) throw new Error("Could not read the image dimensions.");
      Object.assign(row, {
        image_path,
        thumbnail_path,
        original_path,
        width: Math.round(img.width),
        height: Math.round(img.height),
        blur_data_url: typeof img.blur_data_url === "string" && img.blur_data_url.length < 6000 ? img.blur_data_url : null,
        dominant_color: typeof img.dominant_color === "string" && /^#[0-9a-f]{6}$/i.test(img.dominant_color) ? img.dominant_color : null,
      });
    } else if (input.isNew) {
      throw new Error("Add an image of the painting before saving.");
    }

    // A readable, unique address: /works/still-life-with-quinces
    const base = slugify(title) || "untitled";
    let slug = previous && slugify(title) === previous.slug.replace(/-\d+$/, "") ? previous.slug : base;
    if (slug !== previous?.slug) {
      const { data: taken } = await supabase.from("artworks").select("slug, id").like("slug", `${base}%`);
      const used = new Set((taken ?? []).filter((t) => t.id !== input.id).map((t) => t.slug));
      let n = 2;
      while (used.has(slug)) slug = `${base}-${n++}`;
    }
    row.slug = slug;

    if (input.isNew) {
      // New works hang at the start of the walk; reorder them from the collection page.
      const { data: first } = await supabase.from("artworks").select("display_order").order("display_order").limit(1).maybeSingle();
      row.display_order = (first?.display_order ?? 1) - 1;
      const { error } = await supabase.from("artworks").insert({ id: input.id, ...row });
      if (error) throw new Error(`Could not save the painting: ${error.message}`);
    } else {
      const { error } = await supabase.from("artworks").update(row).eq("id", input.id);
      if (error) throw new Error(`Could not save the changes: ${error.message}`);
      // Remove the files the new image replaced.
      if (input.image && previous) {
        await removeFiles(supabase, {
          public: [previous.image_path, previous.thumbnail_path].filter((p): p is string => !!p && p !== row.image_path && p !== row.thumbnail_path),
          originals: previous.original_path && previous.original_path !== row.original_path ? [previous.original_path] : [],
        });
      }
    }

    updateTag(GALLERY_TAG);
    return { ok: true, data: { id: input.id, slug } };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteArtwork(id: string): Promise<ActionResult> {
  try {
    const supabase = await requireAdmin();
    if (!UUID.test(id)) throw new Error("That artwork reference isn't valid.");
    const { data: art } = await supabase
      .from("artworks")
      .select("image_path, thumbnail_path, original_path")
      .eq("id", id)
      .maybeSingle();
    const { error } = await supabase.from("artworks").delete().eq("id", id);
    if (error) throw new Error(`Could not delete the painting: ${error.message}`);
    // Remove every file stored under this artwork's folder, in both buckets.
    await removeFolder(supabase, BUCKET_PUBLIC, id);
    await removeFolder(supabase, BUCKET_ORIGINALS, id);
    if (art) {
      await removeFiles(supabase, {
        public: [art.image_path, art.thumbnail_path].filter((p): p is string => !!p),
        originals: art.original_path ? [art.original_path] : [],
      });
    }
    updateTag(GALLERY_TAG);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Saves the hanging order. `ids` is the full list in its new order. */
export async function reorderArtworks(ids: string[]): Promise<ActionResult> {
  try {
    const supabase = await requireAdmin();
    if (!Array.isArray(ids) || ids.length > 2000 || !ids.every((i) => UUID.test(i))) throw new Error("Invalid order.");
    const results = await Promise.all(
      ids.map((id, index) => supabase.from("artworks").update({ display_order: (index + 1) * 10 }).eq("id", id)),
    );
    const failed = results.find((r) => r.error);
    if (failed?.error) throw new Error(`Could not save the order: ${failed.error.message}`);
    updateTag(GALLERY_TAG);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function setArtworkFlags(id: string, flags: { is_published?: boolean; is_featured?: boolean }): Promise<ActionResult> {
  try {
    const supabase = await requireAdmin();
    if (!UUID.test(id)) throw new Error("That artwork reference isn't valid.");
    const patch: Record<string, boolean> = {};
    if (typeof flags.is_published === "boolean") patch.is_published = flags.is_published;
    if (typeof flags.is_featured === "boolean") patch.is_featured = flags.is_featured;
    const { error } = await supabase.from("artworks").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    updateTag(GALLERY_TAG);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ---------------------------------------------------------------------------------------------
//  Site details
// ---------------------------------------------------------------------------------------------

const SETTINGS_FIELDS: Record<string, number> = {
  artist_name: 120,
  hero_kicker: 160,
  hero_statement: 600,
  intro_heading: 160,
  intro_body: 4000,
  room_one_title: 120,
  room_two_title: 120,
  closing_heading: 160,
  closing_body: 1200,
  contact_email: 200,
  instagram_url: 300,
  extra_link_label: 80,
  extra_link_url: 300,
  about_kicker: 120,
  about_title: 200,
  about_lede: 1200,
  about_portrait_caption: 300,
  meta_description: 300,
};

export async function saveSettings(
  input: Partial<SiteSettings> & { portrait?: { path: string | null; width: number | null; height: number | null } },
): Promise<ActionResult> {
  try {
    const supabase = await requireAdmin();
    const row: Record<string, unknown> = { id: 1 };
    for (const [key, max] of Object.entries(SETTINGS_FIELDS)) {
      if (key in input) row[key] = text((input as Record<string, unknown>)[key], max);
    }
    if ("artist_name" in input && !row.artist_name) throw new Error("The artist name can't be empty.");
    for (const key of ["instagram_url", "extra_link_url"]) {
      const v = row[key];
      if (typeof v === "string" && !/^https?:\/\//i.test(v)) throw new Error("Links must start with https://");
    }
    if (typeof row.contact_email === "string" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.contact_email)) {
      throw new Error("That email address doesn't look right.");
    }

    let oldPortrait: string | null = null;
    if (input.portrait) {
      const { data } = await supabase.from("site_settings").select("about_portrait_path").eq("id", 1).maybeSingle();
      oldPortrait = data?.about_portrait_path ?? null;
      const path = input.portrait.path ? safePath(input.portrait.path) : null;
      if (input.portrait.path && !path) throw new Error("The portrait upload is invalid.");
      row.about_portrait_path = path;
      row.about_portrait_width = path ? Math.round(input.portrait.width ?? 0) || null : null;
      row.about_portrait_height = path ? Math.round(input.portrait.height ?? 0) || null : null;
    }

    const { error } = await supabase.from("site_settings").upsert(row, { onConflict: "id" });
    if (error) throw new Error(`Could not save: ${error.message}`);
    if (oldPortrait && oldPortrait !== row.about_portrait_path) {
      await removeFiles(supabase, { public: [oldPortrait], originals: [] });
    }
    updateTag(GALLERY_TAG);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ---------------------------------------------------------------------------------------------
//  About page
// ---------------------------------------------------------------------------------------------

export interface AboutSectionInput {
  id: string;
  kind: AboutSectionKind;
  heading: string;
  body: string;
  image_path: string | null;
  image_caption: string;
  image_width: number | null;
  image_height: number | null;
}

export async function saveAboutSections(sections: AboutSectionInput[]): Promise<ActionResult> {
  try {
    const supabase = await requireAdmin();
    if (!Array.isArray(sections) || sections.length > 60) throw new Error("Too many sections.");

    const { data: existing } = await supabase.from("about_sections").select("id, image_path");
    const keep = new Set<string>();
    const rows = sections.map((s, i) => {
      if (!UUID.test(s.id)) throw new Error("A section reference isn't valid.");
      keep.add(s.id);
      const image = s.image_path ? safePath(s.image_path) : null;
      if (s.image_path && !image) throw new Error("An uploaded photograph path is invalid.");
      return {
        id: s.id,
        kind: s.kind === "quote" ? "quote" : "chapter",
        heading: s.kind === "quote" ? null : text(s.heading, 200),
        body: (typeof s.body === "string" ? s.body.trim() : "").slice(0, 20000),
        image_path: s.kind === "quote" ? null : image,
        image_caption: s.kind === "quote" || !image ? null : text(s.image_caption, 300),
        image_width: image ? Math.round(s.image_width ?? 0) || null : null,
        image_height: image ? Math.round(s.image_height ?? 0) || null : null,
        display_order: (i + 1) * 10,
      };
    });

    if (rows.length) {
      const { error } = await supabase.from("about_sections").upsert(rows, { onConflict: "id" });
      if (error) throw new Error(`Could not save the About page: ${error.message}`);
    }
    const removed = (existing ?? []).filter((e) => !keep.has(e.id));
    if (removed.length) {
      const { error } = await supabase.from("about_sections").delete().in("id", removed.map((r) => r.id));
      if (error) throw new Error(`Could not remove a section: ${error.message}`);
    }
    // Clean up photographs that are no longer used.
    const stillUsed = new Set(rows.map((r) => r.image_path).filter(Boolean));
    const orphaned = (existing ?? []).map((e) => e.image_path).filter((p): p is string => !!p && !stillUsed.has(p));
    if (orphaned.length) await removeFiles(supabase, { public: orphaned, originals: [] });

    updateTag(GALLERY_TAG);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Discard files uploaded during an edit that was then abandoned or failed to save. */
export async function discardUploads(paths: { public: string[]; originals: string[] }): Promise<ActionResult> {
  try {
    const supabase = await requireAdmin();
    await removeFiles(supabase, {
      public: paths.public.map(safePath).filter((p): p is string => !!p),
      originals: paths.originals.map(safePath).filter((p): p is string => !!p),
    });
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ---------------------------------------------------------------------------------------------
//  Storage helpers
// ---------------------------------------------------------------------------------------------

type Client = Awaited<ReturnType<typeof requireAdmin>>;

async function removeFiles(supabase: Client, paths: { public: string[]; originals: string[] }) {
  // Storage clean-up is best effort: a leftover file never breaks the gallery.
  if (paths.public.length) {
    const { error } = await supabase.storage.from(BUCKET_PUBLIC).remove(paths.public);
    if (error) console.warn("[admin] could not remove files:", error.message);
  }
  if (paths.originals.length) {
    const { error } = await supabase.storage.from(BUCKET_ORIGINALS).remove(paths.originals);
    if (error) console.warn("[admin] could not remove originals:", error.message);
  }
}

async function removeFolder(supabase: Client, bucket: string, folder: string) {
  const { data, error } = await supabase.storage.from(bucket).list(folder, { limit: 1000 });
  if (error || !data?.length) return;
  const { error: rmError } = await supabase.storage.from(bucket).remove(data.map((f) => `${folder}/${f.name}`));
  if (rmError) console.warn(`[admin] could not empty ${bucket}/${folder}:`, rmError.message);
}
