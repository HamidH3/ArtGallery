import Link from "next/link";
import { getCopyrightYear, getSiteSettings } from "@/lib/data";

/** The small print at the foot of every public page. */
export async function Colophon() {
  const [s, year] = await Promise.all([getSiteSettings(), getCopyrightYear()]);
  const links = [
    s.contact_email ? { label: s.contact_email, href: `mailto:${s.contact_email}` } : null,
    s.instagram_url ? { label: "Instagram", href: s.instagram_url } : null,
  ].filter((l): l is { label: string; href: string } => Boolean(l));

  return (
    <footer className="colophon on-dark relative px-6 py-10 text-[0.92rem] text-wall-muted sm:px-10 lg:px-16">
      <div className="mx-auto flex max-w-[90rem] flex-col items-center justify-between gap-5 text-center sm:flex-row sm:items-end sm:text-left">
        <div className="space-y-1.5">
          <p>© {year} {s.artist_name}. All paintings are the artist&rsquo;s own work.</p>
          <p className="text-[0.8rem] leading-relaxed text-wall-muted/65">
            Backgrounds: <em>The Creation of Adam</em> (detail), Michelangelo, public domain. Natural History Museum entrance, photo by
            sagesolar,{" "}
            <a href="https://creativecommons.org/licenses/by/4.0/" className="underline decoration-wall-muted/40 underline-offset-2 hover:text-wall-text" rel="license noreferrer" target="_blank">
              CC BY 4.0
            </a>
            , darkened.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          <Link href="/" className="link-quiet hover:text-wall-text">
            Gallery
          </Link>
          <Link href="/about" className="link-quiet hover:text-wall-text">
            About
          </Link>
          {links.map((l) => (
            <a key={l.href} href={l.href} className="link-quiet hover:text-wall-text" {...(l.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}>
              {l.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
