"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Gallery · wordmark · About. Symmetrical, like the lettering over a museum entrance.
 * Over the dark entrance hall it is transparent; once the visitor walks in it settles onto parchment.
 */
export function SiteNav({ name }: { name: string }) {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const onWork = pathname.startsWith("/works/");
  const [pastHero, setPastHero] = useState(false);

  useEffect(() => {
    if (!onHome) return;
    const update = () => setPastHero(window.scrollY > window.innerHeight * 0.72);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [onHome]);

  // The whole site is dark now; the bar only gains a backing once the visitor scrolls past the entrance.
  const tone = "dark";
  const showWordmark = !onHome || pastHero;
  const galleryCurrent = onHome || onWork;

  return (
    <header
      data-tone={tone}
      data-solid={(onHome && pastHero) || (!onHome && !onWork) || undefined}
      data-dark-solid=""
      className="site-nav fixed inset-x-0 top-0 z-50"
    >
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <nav aria-label="Main" className="mx-auto grid h-[var(--nav-h)] max-w-[90rem] grid-cols-[1fr_auto_1fr] items-center px-5 sm:px-10 lg:px-16">
        <Link href="/" className="nav-link justify-self-start" aria-current={galleryCurrent ? "page" : undefined}>
          Gallery
        </Link>
        <Link
          href="/"
          className="wordmark px-3 font-display text-[1.28rem] font-medium tracking-[0.06em] whitespace-nowrap sm:text-[1.45rem]"
          data-visible={showWordmark || undefined}
          aria-label={`${name}, home`}
          tabIndex={showWordmark ? undefined : -1}
        >
          {name}
        </Link>
        <Link href="/about" className="nav-link justify-self-end" aria-current={pathname === "/about" ? "page" : undefined}>
          About
        </Link>
      </nav>
    </header>
  );
}
