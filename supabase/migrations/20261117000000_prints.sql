-- =============================================================================================
--  Prints: which paintings can be bought as prints.
--  Run once: Supabase Dashboard → SQL Editor → paste this file → Run. Safe to re-run.
--  Every painting starts as not for sale; switch prints on per painting in the dashboard.
-- =============================================================================================

alter table public.artworks
  add column if not exists print_available boolean not null default false;
