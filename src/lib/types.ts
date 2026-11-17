export type FrameStyle = "auto" | "gilt" | "walnut" | "paper" | "none";

export interface Artwork {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  year: number | null;
  medium: string | null;
  dimensions: string | null;
  alt_text: string | null;
  image_path: string;
  thumbnail_path: string | null;
  original_path: string | null;
  width: number;
  height: number;
  blur_data_url: string | null;
  dominant_color: string | null;
  frame_style: FrameStyle;
  is_featured: boolean;
  is_published: boolean;
  /** Can be bought as a print (see the Purchase page). Missing before the prints migration is run. */
  print_available?: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  /** Preview-only empty frame (no image). */
  placeholder?: boolean;
}

export interface SiteSettings {
  artist_name: string;
  hero_kicker: string;
  hero_statement: string;
  intro_heading: string;
  intro_body: string;
  room_one_title: string;
  room_two_title: string;
  closing_heading: string;
  closing_body: string;
  contact_email: string | null;
  instagram_url: string | null;
  extra_link_label: string | null;
  extra_link_url: string | null;
  about_kicker: string;
  about_title: string;
  about_lede: string;
  about_portrait_path: string | null;
  about_portrait_caption: string | null;
  about_portrait_width: number | null;
  about_portrait_height: number | null;
  meta_description: string;
  updated_at?: string;
}

export type AboutSectionKind = "chapter" | "quote";

export interface AboutSection {
  id: string;
  kind: AboutSectionKind;
  heading: string | null;
  body: string;
  image_path: string | null;
  image_caption: string | null;
  image_width: number | null;
  image_height: number | null;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}
