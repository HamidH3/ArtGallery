# The Gallery

A personal art gallery website laid out like a room in an old European museum, made only to display paintings: there's no shop and nothing for sale. Visitors come in through a lamp-lit entrance hall into two rooms: principal works, each on its own olive silk wall between a cornice and a dado rail, and a cabinet where smaller works hang together on a shared centre line. Selecting a painting opens a viewing room with the full label and a close-up mode.

Everything is managed from a private dashboard at `/admin`: upload paintings, write their labels, choose frames, set the order, and edit the About page and the gallery's wording. No code changes needed.

**Stack:** Next.js 16 (App Router, Cache Components) · React 19 · TypeScript · Tailwind CSS 4 · Supabase (Postgres, Auth, Storage) · Vercel.

---

## What's included

**Public site**
- **Entrance hall:** the **HH** monogram inside a gilt doorway filled with a dim, glowing stained-glass window. Above the doorway, faded like an old ceiling, the meeting hands from Michelangelo's *Creation of Adam*. One slow "lights up" animation on arrival.
- **Wall text:** an introduction to the collection with a running count of works and years, written the way a curator would.
- **Room I, principal works:** a painted vault (a bay of the Sistine Chapel ceiling) above the cornice, and coloured window light falling across the top of the olive silk wall. Below it, each featured painting hangs on its own wall with a printed label and note beside it.
- **Room II, the cabinet:** the rest of the collection hung in groups of two or three, varied in size and centred on one eye line. On phones it becomes a single column with alternating offsets.
- **Frames:** four CSS-built styles (antique gilt, walnut with gold slip, ivory mount for works on paper, unframed canvas), chosen per painting. *Automatic* picks gilt for paintings and a mount for drawings and watercolours.
- **Viewing room:** a large view of the painting, never cropped or distorted, with title, date, medium, size and notes. Arrow keys move between works, *Look closer* opens the full-resolution image for panning, and Escape or the browser's Back button returns the visitor to the same spot on the wall. Each painting also has a shareable address (`/works/<title>`) that opens as its own page.
- **About page:** an arched portrait and a story told in numbered chapters, with optional studio photographs, pull quotations and lists (influences, exhibitions).
- SEO metadata, Open Graph images per painting, sitemap, robots rules, keyboard focus styles, skip link and reduced-motion support.

**Dashboard (`/admin`)**
- Email and password sign-in, with password reset by email.
- **Add a painting:** drag a photograph in, fill in title, year, medium, dimensions, notes and screen-reader description, choose a frame, then mark it as a principal work or hide it. A live preview shows exactly how it will hang.
- **Collection:** drag to reorder (mouse, touch or keyboard), or use the arrow buttons. Toggle *Principal* and *On view* inline.
- Edit or replace any painting's image, and delete it along with all its stored files.
- **About page editor:** portrait, introduction, chapters, quotations and photographs, all reorderable.
- **Site details:** your name or monogram (shown as the wordmark everywhere), entrance text, wall text, room names, closing text, optional contact email and links (left empty, nothing is shown), and search description.

**Images**
- The original photograph is uploaded **untouched** to a private bucket, in resumable 6 MB chunks so large files survive a dropped connection.
- The browser makes the web copies before uploading: a 2560 px display image and a 960 px thumbnail (WebP at high quality), plus a tiny blurred placeholder and an average colour for the moment before the image loads. Big photographs never pass through a server function, which avoids Vercel's request-size limit.
- On the site, Next.js serves each display copy as AVIF/WebP at the size each device needs, lazy-loading anything off screen.

---

## 1. Run it locally

Requires Node.js 20.9 or newer.

```bash
npm install
cp .env.example .env.local   # fill in after step 2, or leave empty for preview mode
npm run dev
```

Open http://localhost:3000. Without Supabase variables, the site runs in **preview mode**: the rooms are hung with empty, primed canvases so you can judge the layout, and a small note explains why.

---

## 2. Set up Supabase

1. **Create a project** at https://supabase.com/dashboard (the Free plan is fine to start).
2. **Create the database.** Open **SQL Editor → New query**, paste the whole of `supabase/migrations/20261116000000_gallery.sql` and click **Run**. This creates:
   - `artworks`, `site_settings`, `about_sections` and `admins` tables;
   - Row Level Security on every table: anyone can read published paintings and page text, and only administrators can change anything;
   - two storage buckets, `artworks` (public web copies) and `artwork-originals` (private originals, readable only by administrators), with upload and delete limited to administrators;
   - placeholder wording for the site and the About page.

   The script is safe to run again.
3. **Create your login.** Go to **Authentication → Users → Add user → Create new user**, enter your email and a strong password, and tick *Auto Confirm User*.
4. **Make yourself an administrator.** In the SQL Editor, open `supabase/make-admin.sql`, replace `you@example.com` with your email, and run it. Only accounts listed in `admins` can use the dashboard.
5. **Turn off public sign-ups.** Under **Authentication → Sign In / Providers**, switch off *Allow new users to sign up*. Nobody else needs an account. (Even if someone did sign up, they couldn't change anything, because they aren't in `admins`.)
6. **Set the auth URLs.** Under **Authentication → URL Configuration**:
   - **Site URL:** your live address, e.g. `https://yourname.com` (use `http://localhost:3000` until you deploy);
   - **Redirect URLs:** add `http://localhost:3000/**`, `https://yourname.com/**` and, for Vercel preview deployments, `https://*-<your-vercel-team>.vercel.app/**`.
7. **(Recommended) Password-reset email.** The default reset link works when you open it in the same browser you requested it from. To make it work from any device, go to **Authentication → Emails → Reset Password** and set the link to:
   ```html
   <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/admin/update-password">Choose a new password</a>
   ```
8. **Copy the keys.** In **Project Settings → API Keys**, copy the **Project URL** and the **publishable key** (`sb_publishable_…`) into `.env.local`. The legacy *anon* key works too (use `NEXT_PUBLIC_SUPABASE_ANON_KEY`).

> **Never** put the `service_role` or secret key in this project or in Vercel. Nothing here needs it: every write runs as the signed-in administrator and is checked by Row Level Security.

Restart `npm run dev`, go to http://localhost:3000/admin, sign in, and add your first painting.

**Upload size.** The Supabase Free plan accepts files up to 50 MB. That covers a maximum-quality JPEG of almost any painting photograph. TIFF and RAW files can't be read by web browsers, so export a JPEG or PNG first. On a paid plan you can raise the limit in **Storage → Settings** and in the `file_size_limit` values in the migration.

---

## 3. Deploy to Vercel

1. Push this folder to a GitHub repository.
2. In Vercel, **Add New → Project**, import the repository. The framework is detected as Next.js; keep the default build settings.
3. Under **Environment Variables**, add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `NEXT_PUBLIC_SITE_URL` (your final address). Apply them to Production and Preview.
4. Deploy. Then add your custom domain under **Settings → Domains**, and update the Supabase **Site URL** and **Redirect URLs** (step 2.6) to match.

Changes saved in the dashboard appear on the live site immediately: each save clears the gallery's cache.

---

## Making it yours

| To change… | Where |
| --- | --- |
| Your name or monogram (currently **HH**), entrance text, wall text, room names, optional contact links | Dashboard → **Site details**. A name of up to four letters with no spaces is set as a large monogram; a full name is set on two lines. |
| The Michelangelo backgrounds | `public/fresco/` (replace the files, keeping the names), placed in `Hero.tsx` and `GalleryRooms.tsx` |
| The stained glass and window light | `src/components/site/StainedGlass.tsx` and `WindowLight.tsx` (colours are at the top of each file) |
| About page text, portrait and photographs | Dashboard → **About page** |
| Colours | `src/app/globals.css`, the `@theme` block at the top (parchment, walnut, olive wall, gold, burgundy) |
| Typefaces | `src/app/fonts.ts` (Cormorant Garamond for display, EB Garamond for reading, self-hosted in `src/fonts`) |
| Frame styles | `.frame-gilt`, `.frame-walnut`, `.frame-paper` and `.frame-none` in `globals.css` |
| How works are grouped on the walls | `src/lib/hang.ts` |
| Image sizes and upload limit | `src/lib/config.ts` |

## Background images

The two fresco details in `public/fresco/` are from Michelangelo's Sistine Chapel ceiling (1508–1512), taken from Wikimedia Commons, where both are marked as faithful reproductions of public-domain works:
- `creation-hands.jpg`: a detail of *The Creation of Adam*, used above the entrance;
- `sistine-vault.jpg`: the first bay of the ceiling (*Separation of Light from Darkness*, with Jeremiah and the Persian Sibyl), used as Room I's painted vault.

They are shown dimmed and warm-toned so they never compete with your paintings, and they are credited in the footer. The stained glass and coloured light are drawn in code (SVG), not photographs.

## Project structure

```
src/
  app/
    (site)/            public pages: gallery, about, works/[slug]
    admin/             dashboard: login, password reset, collection, editors, Server Actions
    auth/confirm/      handles links in Supabase emails
  components/
    site/              Hero, WallText, GalleryRooms, Frame, WallLabel, ViewingRoom, …
    admin/             ArtworkEditor, CollectionManager, AboutEditor, SettingsEditor, …
  lib/
    data.ts            cached public reads (tagged; refreshed on every admin save)
    admin-data.ts      admin reads (signed-in session)
    upload.ts          in-browser web copies + resumable original upload
    hang.ts            the hanging plan
    supabase/          browser, server and public clients
  proxy.ts             refreshes the session and guards /admin
supabase/
  migrations/          schema, security policies, storage buckets, placeholder content
  make-admin.sql       grants dashboard access to your account
```

## Security model

- The browser only ever holds the **publishable** key. All protection is in the database.
- **Row Level Security:** visitors and signed-in non-admins can read published paintings, settings and About sections, and nothing else. They cannot see hidden paintings, the admins list, or the private originals, and cannot write anywhere. Administrators are identified by `public.is_admin()`, which checks the `admins` table.
- **Storage:** uploading, replacing, listing and deleting files is limited to administrators in both buckets. The public bucket serves files by URL but can't be listed. Originals are private.
- **Three checks on the dashboard:** the proxy turns away signed-out visitors, each page verifies the administrator on the server, and every Server Action re-verifies before writing. The database enforces the same rules whatever the app does.

## What has been tested, and what hasn't

Tested in development:
- Production build (`next build`), with screenshots reviewed at desktop (1440 px) and phone (390 px) widths.
- The full migration on PostgreSQL 16 against stand-ins for Supabase's `auth` and `storage` schemas, including re-running it. **47 permission checks** passed, covering visitors, a signed-in stranger and an administrator against every table and both buckets.
- In headless Chrome: opening the viewing room, arrow keys, *Look closer*, Escape, the browser's Back button, scroll position and focus all return correctly. The upload form reads a dropped photograph, previews it in its frame, and makes the web copies.

**Not yet tested against a live Supabase project**, because none was connected while building: real sign-in, the resumable upload to Supabase Storage, and saving through the Server Actions. After completing section 2, upload one painting end to end before sharing the site.
