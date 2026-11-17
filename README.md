# The Gallery

A personal art gallery website laid out like a room in an old European museum, made only to display paintings: there's no shop and nothing for sale. Visitors come in through a lamp-lit entrance hall into two rooms: principal works, each on its own olive silk wall between a cornice and a dado rail, and a cabinet where smaller works hang together on a shared centre line. Selecting a painting opens a viewing room with the full label and a close-up mode.

Everything is managed from a private dashboard at `/admin`: upload paintings, write their labels, choose frames, set the order, and edit the About page and the gallery's wording. No code changes needed.

**Stack:** Next.js 16 (App Router, Cache Components) · React 19 · TypeScript · Tailwind CSS 4 · Supabase (Postgres, Auth, Storage) · Vercel.

---

## What's included

**Public site**
- **Entrance:** the **HH** monogram in a stained-glass doorway, under a faded detail of Michelangelo's *Creation of Adam*.
- **Gallery:** one continuous scroll of paintings, each centred on a dark wall in its own frame, with no writing. Paintings marked *hang larger* get more space. Behind everything sits a dark, faded 1851 photograph of a carved church doorway.
- **Larger view:** click a painting to see it big, with nothing else on screen. Click it again to look closer and drag to move around; arrow keys move between paintings; Escape or Back returns to the same spot.
- **About:** a short background, in your own words, and nothing else. The text lives in `src/content/about.ts`.

**Dashboard (`/admin`)**
- Email and password sign-in, with password reset by email.
- **Add a painting:** drop in a photo, choose a frame (dark walnut, aged gilt, black with ivory mount, or no frame), optionally name it, and click *Hang the painting*. A live preview shows exactly how it will look.
- **Collection:** drag paintings into the order visitors scroll past them; toggle *Larger* and *On view*; edit, replace or delete any painting.
- **Site details:** the name at the entrance (HH), the line above it, optional footer links and the search description.

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
| About page text | `src/content/about.ts` |
| Background images | `public/fresco/creation-hands.jpg` (entrance) and `public/backdrop/old-doorway.jpg` (behind everything) |
| Stained glass colours | `src/components/site/StainedGlass.tsx` |
| About page text, portrait and photographs | Dashboard → **About page** |
| Colours | `src/app/globals.css`, the `@theme` block at the top (parchment, walnut, olive wall, gold, burgundy) |
| Typefaces | `src/app/fonts.ts` (Cormorant Garamond for display, EB Garamond for reading, self-hosted in `src/fonts`) |
| Frame styles | `.frame-gilt`, `.frame-walnut`, `.frame-paper` and `.frame-none` in `globals.css` |
| How works are grouped on the walls | `src/lib/hang.ts` |
| Image sizes and upload limit | `src/lib/config.ts` |

## Background images

- `public/fresco/creation-hands.jpg`: a detail of Michelangelo's *The Creation of Adam* (Sistine Chapel, c. 1511), public domain, via Wikimedia Commons.
- `public/backdrop/old-doorway.jpg`: *Central Portal of the Church of Saint-Jacques, Aubeterre* (1851) by Gustave Le Gray, from the Metropolitan Museum of Art, released as CC0 (no credit required), via Wikimedia Commons. Toned and darkened.

Both images are free to use without credit, so the site doesn't show any.

The stained glass is drawn in code (SVG), not a photograph.

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

## Selling prints

The **Purchase** page sells prints of the paintings you mark *Sell prints* in the dashboard (each painting starts as not for sale). Sizes, prices, delivery and the delivery/returns text are all in `src/content/prints.ts`.

Payments run through **Stripe Checkout**: when a visitor clicks *Buy this print*, the site asks Stripe for a secure payment page and sends them there. Card numbers and Apple Pay are handled entirely by Stripe and never reach this site. The price is decided on the server from `prints.ts`, so it can't be changed from a browser. Stripe collects the delivery address, emails the receipt, and lists every order (painting, size, address) in the Stripe Dashboard.

Setup:
1. Run `supabase/migrations/20261117000000_prints.sql` in the Supabase SQL Editor.
2. Create a Stripe account, then add `STRIPE_SECRET_KEY` to Vercel (type **Secret**; never `NEXT_PUBLIC_`) and redeploy. Use a `sk_test_…` key to try it with Stripe's test cards, then switch to the `sk_live_…` key.
3. In Stripe: turn on customer receipt emails and payment notifications, keep only Cards and Apple Pay switched on under Payment methods, and set your branding.
