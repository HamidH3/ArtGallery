/*
 * Content shown before Supabase is connected (and the defaults that supabase/seed.sql writes).
 *
 * There are deliberately no paintings here: the preview hangs empty, primed canvases so the
 * layout can be judged before the real collection is uploaded from the dashboard.
 */
import type { AboutSection, Artwork, SiteSettings } from "./types";

export const defaultSettings: SiteSettings = {
  artist_name: "HH",
  hero_kicker: "A private collection of paintings",
  hero_statement:
    "Paintings and drawings, hung as they would be in a quiet room of an old gallery, with time to look at each one.",
  intro_heading: "About the collection",
  intro_body:
    "This is an evolving collection of paintings and drawings, gathered in one place so they can be seen together as a body of work rather than one at a time.\n\nThey are hung the way pictures were hung in the old galleries: principal works on walls of their own, smaller paintings and studies together in the cabinet, each with a label beside it. Select any picture to see it closer, with notes on when and how it was made.",
  room_one_title: "Principal works",
  room_two_title: "The cabinet",
  closing_heading: "The rooms stay open",
  closing_body:
    "New paintings are hung here as they leave the easel. Thank you for walking through the rooms.",
  contact_email: null,
  instagram_url: null,
  extra_link_label: null,
  extra_link_url: null,
  about_kicker: "The artist",
  about_title: "Notes from the studio",
  about_lede:
    "A short introduction in your own words: who you are, what you paint, and why. Two or three sentences are enough to set the tone for the rest of the page.",
  about_portrait_path: null,
  about_portrait_caption: null,
  about_portrait_width: null,
  about_portrait_height: null,
  meta_description: "A private gallery of paintings and drawings by HH.",
};

const blank = { image_path: null, image_caption: null, image_width: null, image_height: null };

export const defaultAbout: AboutSection[] = [
  {
    id: "about-1",
    kind: "chapter",
    heading: "Beginnings",
    body:
      "Begin with the first drawings you remember making: where you were, what you drew, and who noticed. Visitors read this page slowly, so a paragraph or two of plain, specific detail will carry further than a summary.\n\nEverything on this page is placeholder text. Replace it from the dashboard under About page, where each chapter can also carry a photograph of the studio or of work in progress.",
    display_order: 1,
    ...blank,
  },
  {
    id: "about-2",
    kind: "quote",
    heading: null,
    body: "Use this space for a single sentence you return to: something you believe about painting, or something a teacher once told you.",
    display_order: 2,
    ...blank,
  },
  {
    id: "about-3",
    kind: "chapter",
    heading: "The journey",
    body:
      "Describe how the work developed: lessons or training, the years of practice, the pictures that marked a change. Name the materials you came to rely on and the subjects you kept returning to.\n\nA photograph sits well beside this chapter. Add one from the dashboard and it will be framed and captioned here.",
    display_order: 3,
    ...blank,
  },
  {
    id: "about-4",
    kind: "chapter",
    heading: "Painters I return to",
    body:
      "Write about the artists, movements and places that shaped the way you see. A short list works well here; begin each line with a hyphen and it will be set as a list.\n\n- A painter whose work changed how you see\n- A period or movement you study\n- A place, a light or a season you keep painting",
    display_order: 4,
    ...blank,
  },
  {
    id: "about-5",
    kind: "chapter",
    heading: "On traditional painting",
    body:
      "Explain your relationship with the old methods: drawing from life, preparing grounds, building a picture in layers. What do you keep from tradition, and where do you depart from it?",
    display_order: 5,
    ...blank,
  },
  {
    id: "about-6",
    kind: "chapter",
    heading: "The practice today",
    body:
      "Close with how you work now: a typical day in the studio, what you are painting at the moment, and what you hope visitors take away from the collection.",
    display_order: 6,
    ...blank,
  },
  {
    id: "about-7",
    kind: "chapter",
    heading: "Exhibitions",
    body: "List exhibitions, prizes and collections, one per line, most recent first.\n\n- Year, title of exhibition, venue, city\n- Year, title of exhibition, venue, city",
    display_order: 7,
    ...blank,
  },
];

/* ---------------------------------------------------------------------------------------------
 * Empty canvases for the preview hang. Proportions follow common stretcher sizes.
 * ------------------------------------------------------------------------------------------- */
const slots: { w: number; h: number; featured?: boolean; frame?: Artwork["frame_style"] }[] = [
  { w: 3, h: 2, featured: true },
  { w: 4, h: 5, featured: true },
  { w: 5, h: 4, featured: true, frame: "walnut" },
  { w: 4, h: 5 },
  { w: 3, h: 2 },
  { w: 1, h: 1, frame: "paper" },
  { w: 5, h: 7 },
  { w: 4, h: 3 },
  { w: 3, h: 4, frame: "paper" },
  { w: 16, h: 9, frame: "walnut" },
  { w: 4, h: 5 },
];

export const previewArtworks: Artwork[] = slots.map((s, i) => ({
  id: `preview-${i + 1}`,
  slug: `preview-${i + 1}`,
  title: "Awaiting a painting",
  description:
    "This frame is a placeholder. Once Supabase is connected, sign in to the dashboard and upload a painting; it will hang here with its title, date, medium and notes.",
  year: null,
  medium: s.frame === "paper" ? "Space for a work on paper" : "Space for a painting",
  dimensions: null,
  alt_text: "An empty frame awaiting a painting",
  image_path: "",
  thumbnail_path: null,
  original_path: null,
  width: s.w * 1000,
  height: s.h * 1000,
  blur_data_url: null,
  dominant_color: null,
  frame_style: s.frame ?? "auto",
  is_featured: Boolean(s.featured),
  is_published: true,
  display_order: i + 1,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  placeholder: true,
}));
