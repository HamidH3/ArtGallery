"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { framedAspect } from "@/lib/hang";
import type { Artwork } from "@/lib/types";
import { Frame } from "./Frame";
import { useLightsUp } from "./useLightsUp";
import { ViewingRoom } from "./ViewingRoom";

/**
 * The collection as one continuous walk: every painting hung on its own, centred, in order,
 * with no labels. Selecting one opens it larger. Paintings marked "hang larger" get more wall.
 */
export function GalleryScroll({ works }: { works: Artwork[] }) {
  const [active, setActive] = useState<number | null>(null);
  const pushed = useRef(false);
  const opener = useRef<HTMLElement | null>(null);

  const open = useCallback(
    (index: number, trigger: HTMLElement) => {
      opener.current = trigger;
      setActive(index);
      const art = works[index];
      if (art && !art.placeholder) {
        window.history.pushState({ viewing: art.slug }, "", `/works/${art.slug}`);
        pushed.current = true;
      }
    },
    [works],
  );

  const changeIndex = useCallback(
    (i: number) => {
      setActive(i);
      const art = works[i];
      if (art && !art.placeholder && pushed.current) {
        window.history.replaceState({ viewing: art.slug }, "", `/works/${art.slug}`);
      }
    },
    [works],
  );

  const close = useCallback(() => {
    setActive(null);
    if (pushed.current) {
      pushed.current = false;
      window.history.back();
    }
    requestAnimationFrame(() => opener.current?.focus({ preventScroll: true }));
  }, []);

  // Browser back / forward.
  useEffect(() => {
    const onPop = () => {
      const m = window.location.pathname.match(/^\/works\/([^/]+)/);
      if (!m) {
        pushed.current = false;
        setActive(null);
        return;
      }
      const i = works.findIndex((a) => a.slug === decodeURIComponent(m[1]!));
      if (i >= 0) {
        pushed.current = true;
        setActive(i);
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [works]);

  return (
    <section id="collection" aria-label="Paintings" className="gallery-scroll relative px-5 pt-[clamp(5rem,14vh,9rem)] pb-[clamp(7rem,18vh,12rem)] sm:px-10">
      <ol className="flex flex-col items-center gap-[clamp(6rem,17vh,12rem)]">
        {works.map((art, i) => (
          <HungPainting key={art.id} art={art} first={i === 0} onOpen={(el) => open(i, el)} />
        ))}
      </ol>

      {active !== null && works[active] ? (
        <ViewingRoom works={works} index={active} onIndexChange={changeIndex} onClose={close} />
      ) : null}
    </section>
  );
}

function HungPainting({ art, first, onOpen }: { art: Artwork; first: boolean; onOpen: (el: HTMLElement) => void }) {
  const ref = useLightsUp<HTMLLIElement>();
  const fa = framedAspect(art);
  const large = art.is_featured;
  // Landscapes are limited by the width of the room, portraits by the height of the screen.
  const maxVw = large ? 92 : fa >= 1.15 ? 82 : 72;
  const maxPx = large ? 1320 : fa >= 1.15 ? 1080 : 820;
  const maxSvh = large ? 86 : 76;

  return (
    <li
      ref={ref}
      className="hang-reveal picture-light w-full"
      style={{ maxWidth: `min(${maxVw}vw, ${maxPx}px, calc(${maxSvh}svh * ${fa.toFixed(4)}))` }}
    >
      <button
        type="button"
        className="work-button block w-full cursor-zoom-in"
        onClick={(e) => onOpen(e.currentTarget)}
        aria-label={art.placeholder ? "Empty frame" : `View ${art.title} larger`}
      >
        <Frame
          art={art}
          sizes={`(min-width: 768px) min(${maxVw}vw, ${maxPx}px), 92vw`}
          preload={first}
        />
      </button>
    </li>
  );
}
