"use client";

import { ChevronLeft, ChevronRight, Minus, Plus, X } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { framedAspect } from "@/lib/hang";
import { displaySize, publicImageUrl } from "@/lib/images";
import { countWords } from "@/lib/format";
import type { Artwork } from "@/lib/types";
import { Frame } from "./Frame";

interface ViewingRoomProps {
  works: Artwork[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

const CLOSE_MS = 480;

/**
 * The viewing room: one painting at a time, lit against a dark wall, with its full label.
 * Keyboard: Escape closes, ← → move between works, Z toggles "look closer".
 */
export function ViewingRoom({ works, index, onIndexChange, onClose }: ViewingRoomProps) {
  const art = works[index]!;
  const [open, setOpen] = useState(false);
  const [closer, setCloser] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const closingRef = useRef(false);

  // Fade in on mount; lock page scroll without shifting the layout.
  useLayoutEffect(() => {
    const { body, documentElement } = document;
    const gap = window.innerWidth - documentElement.clientWidth;
    const prev = { overflow: body.style.overflow, paddingRight: body.style.paddingRight };
    body.style.overflow = "hidden";
    if (gap > 0) body.style.paddingRight = `${gap}px`;
    documentElement.style.setProperty("--scrollbar-gap", `${gap}px`);
    const raf = requestAnimationFrame(() => setOpen(true));
    closeRef.current?.focus({ preventScroll: true });
    return () => {
      cancelAnimationFrame(raf);
      body.style.overflow = prev.overflow;
      body.style.paddingRight = prev.paddingRight;
      documentElement.style.removeProperty("--scrollbar-gap");
    };
  }, []);

  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setOpen(false);
    window.setTimeout(onClose, CLOSE_MS);
  }, [onClose]);

  const go = useCallback(
    (delta: number) => {
      if (works.length < 2) return;
      setCloser(false);
      onIndexChange((index + delta + works.length) % works.length);
    },
    [index, onIndexChange, works.length],
  );

  // Keyboard controls and a simple focus trap.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (closer) setCloser(false);
        else requestClose();
      } else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if ((e.key === "z" || e.key === "Z") && !art.placeholder) setCloser((c) => !c);
      else if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        );
        if (!focusables.length) return;
        const first = focusables[0]!;
        const last = focusables[focusables.length - 1]!;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, requestClose, closer, art.placeholder]);

  // Warm the neighbours so moving through the room feels immediate.
  useEffect(() => {
    for (const d of [1, -1]) {
      const n = works[(index + d + works.length) % works.length];
      if (n && !n.placeholder && n.image_path) {
        const img = new window.Image();
        img.src = publicImageUrl(n.image_path);
      }
    }
  }, [index, works]);

  const fa = framedAspect(art);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="viewing-title"
      data-open={open || undefined}
      className="viewing-room on-dark fixed inset-0 z-[60] overflow-y-auto overscroll-contain lg:overflow-hidden"
    >
      <div className="viewing-room-backdrop" aria-hidden onClick={requestClose} />

      <div className="relative grid min-h-full lg:h-full lg:grid-cols-[minmax(0,1fr)_25rem]">
        {/* The stage */}
        <div className="viewing-stage relative flex min-h-[62svh] items-center justify-center px-5 pt-20 pb-10 sm:px-10 lg:min-h-0 lg:px-16 lg:py-14">
          <div aria-hidden className="viewing-light" />
          <div
            key={art.id}
            className="viewing-picture relative"
            style={{ width: `min(100%, calc((var(--stage-h) - 2rem) * ${fa.toFixed(4)}))` }}
          >
            <Frame art={art} sizes="(min-width: 1024px) 68vw, 94vw" preload />
          </div>
          {closer && !art.placeholder ? <CloserView art={art} onExit={() => setCloser(false)} /> : null}
        </div>

        {/* The label */}
        <aside className="viewing-aside relative flex flex-col px-6 pt-8 pb-12 sm:px-10 lg:overflow-y-auto lg:px-10 lg:pt-24 lg:pb-10">
          <p className="text-[0.95rem] italic text-gold-light">
            {works.length > 1 ? `No. ${index + 1} of ${works.length > 20 ? works.length : countWords(works.length)}` : " "}
          </p>
          <h2 id="viewing-title" className="mt-4 font-display text-[2.4rem] leading-[1.05] font-medium text-ivory italic sm:text-[2.8rem]">
            {art.title}
          </h2>
          <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-[1rem] text-wall-text/85">
            {art.year ? (
              <>
                <dt className="italic text-wall-muted">Date</dt>
                <dd className="tabular-nums">{art.year}</dd>
              </>
            ) : null}
            {art.medium ? (
              <>
                <dt className="italic text-wall-muted">Medium</dt>
                <dd>{art.medium}</dd>
              </>
            ) : null}
            {art.dimensions ? (
              <>
                <dt className="italic text-wall-muted">Size</dt>
                <dd className="tabular-nums">{art.dimensions}</dd>
              </>
            ) : null}
          </dl>

          {art.description ? (
            <div className="mt-8 space-y-4 border-t border-gold/25 pt-7 text-[1.05rem] leading-[1.7] text-wall-text/90">
              {art.description.split(/\n\s*\n/).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          ) : null}

          <div className="mt-auto pt-10">
            {!art.placeholder ? (
              <button
                type="button"
                onClick={() => setCloser((c) => !c)}
                aria-pressed={closer}
                className="viewing-control mb-6 hidden sm:inline-flex"
              >
                {closer ? <Minus size={15} strokeWidth={1.4} /> : <Plus size={15} strokeWidth={1.4} />}
                {closer ? "Step back" : "Look closer"}
              </button>
            ) : null}
            {works.length > 1 ? (
              <div className="flex items-center justify-between border-t border-gold/25 pt-5">
                <button type="button" onClick={() => go(-1)} className="viewing-control">
                  <ChevronLeft size={16} strokeWidth={1.3} /> Previous
                </button>
                <button type="button" onClick={() => go(1)} className="viewing-control">
                  Next <ChevronRight size={16} strokeWidth={1.3} />
                </button>
              </div>
            ) : null}
          </div>
        </aside>
      </div>

      <button ref={closeRef} type="button" onClick={requestClose} className="viewing-close" aria-label="Close and return to the gallery">
        <span className="hidden sm:inline">Close</span>
        <X size={18} strokeWidth={1.3} />
      </button>
    </div>
  );
}

/** Full-resolution inspection: the display copy at its natural size, panned by dragging or scrolling. */
function CloserView({ art, onExit }: { art: Artwork; onExit: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; left: number; top: number; moved: boolean } | null>(null);
  const natural = displaySize(art);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
    el.scrollTop = (el.scrollHeight - el.clientHeight) / 2;
    el.focus({ preventScroll: true });
  }, []);

  return (
    <div
      ref={ref}
      tabIndex={-1}
      aria-label="Detail view. Drag or scroll to move around the painting."
      className="closer-view absolute inset-0 z-10 cursor-grab overflow-auto active:cursor-grabbing"
      onPointerDown={(e) => {
        if (e.pointerType !== "mouse" || !ref.current) return;
        drag.current = { x: e.clientX, y: e.clientY, left: ref.current.scrollLeft, top: ref.current.scrollTop, moved: false };
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d || !ref.current) return;
        const dx = e.clientX - d.x;
        const dy = e.clientY - d.y;
        if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
        ref.current.scrollLeft = d.left - dx;
        ref.current.scrollTop = d.top - dy;
      }}
      onPointerUp={() => {
        const d = drag.current;
        drag.current = null;
        if (d && !d.moved) onExit();
      }}
      onPointerLeave={() => (drag.current = null)}
    >
      <div className="grid min-h-full min-w-full place-items-center p-[12vmin]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={publicImageUrl(art.image_path)}
          alt={art.alt_text || art.title}
          width={natural.width}
          height={natural.height}
          draggable={false}
          className="max-w-none select-none shadow-[0_30px_60px_-20px_rgb(0_0_0/0.8)]"
          style={{ width: `max(${natural.width}px, 140vmax)`, height: "auto" }}
        />
      </div>
    </div>
  );
}
