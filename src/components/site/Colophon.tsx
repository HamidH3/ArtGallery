import Link from "next/link";
import { getCopyrightYear, getSiteSettings } from "@/lib/data";

/** TikTok handle for commission enquiries (without the @). */
const TIKTOK_HANDLE = "real.hh";

/** The small print at the foot of every public page. */
export async function Colophon() {
  const [s, year] = await Promise.all([getSiteSettings(), getCopyrightYear()]);
  const tiktok = `https://www.tiktok.com/@${TIKTOK_HANDLE}`;

  return (
    <footer className="colophon on-dark relative px-6 py-10 text-[0.95rem] text-wall-muted sm:px-10 lg:px-16">
      <div className="mx-auto flex max-w-[90rem] flex-col items-center justify-between gap-5 text-center sm:flex-row sm:items-end sm:text-left">
        <div className="space-y-1.5">
          <p className="font-display text-[1.2rem] italic text-wall-text/90">
            Commissions are open. Message me on TikTok,{" "}
            <a href={tiktok} target="_blank" rel="noreferrer" className="text-gold-pale underline decoration-gold/40 underline-offset-4 hover:text-ivory">
              @{TIKTOK_HANDLE}
            </a>
            .
          </p>
          <p className="text-[0.85rem] text-wall-muted/75">
            © {year} {s.artist_name}. Painted by me; some pieces are my own takes on other artists&rsquo; designs.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          <Link href="/" className="link-quiet hover:text-wall-text">
            Gallery
          </Link>
          <Link href="/about" className="link-quiet hover:text-wall-text">
            About
          </Link>
          <a href={tiktok} target="_blank" rel="noreferrer" className="link-quiet hover:text-wall-text">
            TikTok
          </a>
        </nav>
      </div>
    </footer>
  );
}
