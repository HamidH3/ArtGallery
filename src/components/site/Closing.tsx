import { WindowLight } from "@/components/site/WindowLight";
import Link from "next/link";
import type { SiteSettings } from "@/lib/types";
import { Lozenge } from "./Ornaments";

/** The last room: a closing statement, the way to the artist's story, and how to get in touch. */
export function Closing({ settings }: { settings: SiteSettings }) {
  const links = contactLinks(settings);

  return (
    <section className="surface-walnut on-dark relative overflow-hidden px-6 pt-28 pb-24 text-center sm:pt-36 sm:pb-28" aria-labelledby="closing-title">
      <div className="closing-glow" aria-hidden />
      <WindowLight />
      <div className="relative mx-auto max-w-[38rem]">
        <Lozenge className="mx-auto text-gold-light/70" />
        <h2 id="closing-title" className="mt-8 font-display text-[2.4rem] leading-[1.05] font-light text-ivory sm:text-[3.2rem]">
          {settings.closing_heading}
        </h2>
        <p className="mx-auto mt-6 max-w-[32rem] text-[1.12rem] leading-[1.7] text-wall-text/80">{settings.closing_body}</p>

        <div className="mt-12 flex flex-col items-center gap-8">
          <Link href="/about" className="closing-door group">
            <span className="font-display text-[1.35rem] italic">Meet the artist</span>
          </Link>
          {links.length ? (
            <ul className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-[1.02rem] text-wall-text/75">
              {links.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="link-quiet pb-0.5 transition-colors hover:text-ivory" {...(l.external ? { target: "_blank", rel: "noreferrer" } : {})}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function contactLinks(s: SiteSettings) {
  const links: { label: string; href: string; external?: boolean }[] = [];
  if (s.contact_email) links.push({ label: s.contact_email, href: `mailto:${s.contact_email}` });
  if (s.instagram_url) links.push({ label: "Instagram", href: s.instagram_url, external: true });
  if (s.extra_link_label && s.extra_link_url) links.push({ label: s.extra_link_label, href: s.extra_link_url, external: true });
  return links;
}
