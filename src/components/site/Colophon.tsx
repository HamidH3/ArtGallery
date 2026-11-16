import Link from "next/link";
import { getCopyrightYear, getSiteSettings } from "@/lib/data";

/** The small print at the foot of every public page. */
export async function Colophon() {
  const [s, year] = await Promise.all([getSiteSettings(), getCopyrightYear()]);
  return (
    <footer className="colophon on-dark bg-walnut-deep px-6 py-8 text-[0.92rem] text-wall-muted sm:px-10 lg:px-16">
      <div className="mx-auto flex max-w-[90rem] flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
        <div className="space-y-1">
          <p>
            © {year} {s.artist_name}. All paintings shown here are the work of the artist.
          </p>
          <p className="text-[0.82rem] text-wall-muted/70">
            Ceiling details: Michelangelo, Sistine Chapel, 1508–1512 (public domain).
          </p>
        </div>
        <nav aria-label="Footer" className="flex gap-6">
          <Link href="/" className="link-quiet hover:text-wall-text">
            Gallery
          </Link>
          <Link href="/about" className="link-quiet hover:text-wall-text">
            About
          </Link>
        </nav>
      </div>
    </footer>
  );
}
