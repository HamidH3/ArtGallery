-- =============================================================================================
--  Gallery schema
--  Run once: Supabase Dashboard → SQL Editor → paste this file → Run
--  (or `supabase db push` if you use the Supabase CLI). Safe to re-run.
-- =============================================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------------------------
--  Administrators
--  Only users listed here can change anything. Add yourself with supabase/make-admin.sql.
-- ---------------------------------------------------------------------------------------------
create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

drop policy if exists "Admins can see their own row" on public.admins;
create policy "Admins can see their own row" on public.admins
  for select to authenticated
  using (user_id = (select auth.uid()));
-- No insert/update/delete policies: admins are managed from the SQL editor only.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins a where a.user_id = (select auth.uid()));
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------------------------------
--  updated_at helper
-- ---------------------------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------------------------
--  Artworks
--  image_path      optimised display copy (public bucket `artworks`, long edge 2560px, WebP)
--  thumbnail_path  small copy for the dashboard and previews (public bucket, 960px)
--  original_path   the untouched upload (private bucket `artwork-originals`)
-- ---------------------------------------------------------------------------------------------
create table if not exists public.artworks (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title           text not null check (char_length(title) between 1 and 200),
  description     text check (char_length(description) <= 5000),
  year            integer check (year between 1000 and 2200),
  medium          text check (char_length(medium) <= 200),
  dimensions      text check (char_length(dimensions) <= 120),
  alt_text        text check (char_length(alt_text) <= 500),
  image_path      text not null,
  thumbnail_path  text,
  original_path   text,
  width           integer not null check (width > 0),
  height          integer not null check (height > 0),
  blur_data_url   text check (char_length(blur_data_url) <= 6000),
  dominant_color  text check (dominant_color ~ '^#[0-9a-fA-F]{6}$'),
  frame_style     text not null default 'auto' check (frame_style in ('auto', 'gilt', 'walnut', 'paper', 'none')),
  is_featured     boolean not null default false,
  is_published    boolean not null default true,
  display_order   integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists artworks_hang_idx on public.artworks (is_published, display_order, created_at desc);

drop trigger if exists artworks_touch on public.artworks;
create trigger artworks_touch before update on public.artworks
  for each row execute function public.touch_updated_at();

alter table public.artworks enable row level security;

drop policy if exists "Published artworks are public" on public.artworks;
create policy "Published artworks are public" on public.artworks
  for select to anon, authenticated
  using (is_published or (select public.is_admin()));

drop policy if exists "Admins add artworks" on public.artworks;
create policy "Admins add artworks" on public.artworks
  for insert to authenticated
  with check ((select public.is_admin()));

drop policy if exists "Admins edit artworks" on public.artworks;
create policy "Admins edit artworks" on public.artworks
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Admins remove artworks" on public.artworks;
create policy "Admins remove artworks" on public.artworks
  for delete to authenticated
  using ((select public.is_admin()));

-- ---------------------------------------------------------------------------------------------
--  Site settings (a single row, id = 1): wordmark, gallery copy, contact links, About header
-- ---------------------------------------------------------------------------------------------
create table if not exists public.site_settings (
  id                     integer primary key default 1 check (id = 1),
  artist_name            text not null default 'HH',
  hero_kicker            text,
  hero_statement         text,
  intro_heading          text,
  intro_body             text,
  room_one_title         text,
  room_two_title         text,
  closing_heading        text,
  closing_body           text,
  contact_email          text,
  instagram_url          text,
  extra_link_label       text,
  extra_link_url         text,
  about_kicker           text,
  about_title            text,
  about_lede             text,
  about_portrait_path    text,
  about_portrait_caption text,
  about_portrait_width   integer,
  about_portrait_height  integer,
  meta_description       text,
  updated_at             timestamptz not null default now()
);

drop trigger if exists site_settings_touch on public.site_settings;
create trigger site_settings_touch before update on public.site_settings
  for each row execute function public.touch_updated_at();

alter table public.site_settings enable row level security;

drop policy if exists "Site settings are public" on public.site_settings;
create policy "Site settings are public" on public.site_settings
  for select to anon, authenticated using (true);

drop policy if exists "Admins write site settings" on public.site_settings;
create policy "Admins write site settings" on public.site_settings
  for insert to authenticated with check ((select public.is_admin()));

drop policy if exists "Admins edit site settings" on public.site_settings;
create policy "Admins edit site settings" on public.site_settings
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ---------------------------------------------------------------------------------------------
--  About page chapters and quotations
-- ---------------------------------------------------------------------------------------------
create table if not exists public.about_sections (
  id            uuid primary key default gen_random_uuid(),
  kind          text not null default 'chapter' check (kind in ('chapter', 'quote')),
  heading       text check (char_length(heading) <= 200),
  body          text not null default '' check (char_length(body) <= 20000),
  image_path    text,
  image_caption text check (char_length(image_caption) <= 300),
  image_width   integer,
  image_height  integer,
  display_order integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists about_sections_touch on public.about_sections;
create trigger about_sections_touch before update on public.about_sections
  for each row execute function public.touch_updated_at();

alter table public.about_sections enable row level security;

drop policy if exists "About sections are public" on public.about_sections;
create policy "About sections are public" on public.about_sections
  for select to anon, authenticated using (true);

drop policy if exists "Admins add about sections" on public.about_sections;
create policy "Admins add about sections" on public.about_sections
  for insert to authenticated with check ((select public.is_admin()));

drop policy if exists "Admins edit about sections" on public.about_sections;
create policy "Admins edit about sections" on public.about_sections
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Admins remove about sections" on public.about_sections;
create policy "Admins remove about sections" on public.about_sections
  for delete to authenticated using ((select public.is_admin()));

-- ---------------------------------------------------------------------------------------------
--  Storage
--  artworks            public: optimised display copies, thumbnails, About photographs
--  artwork-originals   private: untouched originals, readable by admins only
--  Size limits are per file. The Supabase Free plan caps uploads at 50 MB regardless of
--  the value here; on Pro you can raise both this and the global limit in Storage settings.
-- ---------------------------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('artworks', 'artworks', true, 26214400,
     array['image/webp', 'image/jpeg', 'image/png', 'image/avif']),
  ('artwork-originals', 'artwork-originals', false, 52428800,
     array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/tiff', 'image/heic', 'image/heif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Files in the public bucket are served by URL without a select policy, so there is deliberately
-- no public select policy: visitors cannot list the bucket. Admins can list, upload and delete.
drop policy if exists "Admins read gallery files" on storage.objects;
create policy "Admins read gallery files" on storage.objects
  for select to authenticated
  using (bucket_id in ('artworks', 'artwork-originals') and (select public.is_admin()));

drop policy if exists "Admins upload gallery files" on storage.objects;
create policy "Admins upload gallery files" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('artworks', 'artwork-originals') and (select public.is_admin()));

drop policy if exists "Admins replace gallery files" on storage.objects;
create policy "Admins replace gallery files" on storage.objects
  for update to authenticated
  using (bucket_id in ('artworks', 'artwork-originals') and (select public.is_admin()))
  with check (bucket_id in ('artworks', 'artwork-originals') and (select public.is_admin()));

drop policy if exists "Admins delete gallery files" on storage.objects;
create policy "Admins delete gallery files" on storage.objects
  for delete to authenticated
  using (bucket_id in ('artworks', 'artwork-originals') and (select public.is_admin()));

-- ---------------------------------------------------------------------------------------------
--  Placeholder content (only inserted if the tables are empty). Edit it from the dashboard.
-- ---------------------------------------------------------------------------------------------
insert into public.site_settings (
  id, artist_name, hero_kicker, hero_statement, intro_heading, intro_body,
  room_one_title, room_two_title, closing_heading, closing_body, contact_email,
  about_kicker, about_title, about_lede, meta_description
) values (
  1,
  'HH',
  'A private collection of paintings',
  'Paintings and drawings, hung as they would be in a quiet room of an old gallery, with time to look at each one.',
  'About the collection',
  $t$This is an evolving collection of paintings and drawings, gathered in one place so they can be seen together as a body of work rather than one at a time.

They are hung the way pictures were hung in the old galleries: principal works on walls of their own, smaller paintings and studies together in the cabinet, each with a label beside it. Select any picture to see it closer, with notes on when and how it was made.$t$,
  'Principal works',
  'The cabinet',
  'The rooms stay open',
  'New paintings are hung here as they leave the easel. Thank you for walking through the rooms.',
  null,
  'The artist',
  'Notes from the studio',
  'A short introduction in your own words: who you are, what you paint, and why. Two or three sentences are enough to set the tone for the rest of the page.',
  'A private gallery of paintings and drawings by HH.'
) on conflict (id) do nothing;

insert into public.about_sections (kind, heading, body, display_order)
select * from (values
  ('chapter', 'Beginnings', $t$Begin with the first drawings you remember making: where you were, what you drew, and who noticed. Visitors read this page slowly, so a paragraph or two of plain, specific detail will carry further than a summary.

Everything on this page is placeholder text. Replace it from the dashboard under About page, where each chapter can also carry a photograph of the studio or of work in progress.$t$, 1),
  ('quote', null, 'Use this space for a single sentence you return to: something you believe about painting, or something a teacher once told you.', 2),
  ('chapter', 'The journey', $t$Describe how the work developed: lessons or training, the years of practice, the pictures that marked a change. Name the materials you came to rely on and the subjects you kept returning to.

A photograph sits well beside this chapter. Add one from the dashboard and it will be framed and captioned here.$t$, 3),
  ('chapter', 'Painters I return to', $t$Write about the artists, movements and places that shaped the way you see. A short list works well here; begin each line with a hyphen and it will be set as a list.

- A painter whose work changed how you see
- A period or movement you study
- A place, a light or a season you keep painting$t$, 4),
  ('chapter', 'On traditional painting', 'Explain your relationship with the old methods: drawing from life, preparing grounds, building a picture in layers. What do you keep from tradition, and where do you depart from it?', 5),
  ('chapter', 'The practice today', 'Close with how you work now: a typical day in the studio, what you are painting at the moment, and what you hope visitors take away from the collection.', 6),
  ('chapter', 'Exhibitions', $t$List exhibitions, prizes and collections, one per line, most recent first.

- Year, title of exhibition, venue, city
- Year, title of exhibition, venue, city$t$, 7)
) as v(kind, heading, body, display_order)
where not exists (select 1 from public.about_sections);
