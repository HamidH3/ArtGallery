"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { framedAspect } from "@/lib/hang";
import { displaySize, publicImageUrl } from "@/lib/images";
import type { Artwork } from "@/lib/types";
import { Frame } from "./Frame";

interface ViewingRoomProps {
  works: Artwork[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

const CLOSE_MS = 450;

/**
 * One painting at a time, large, on a dark wall, with nothing else to read.
 * Click the painting to look closer (then drag to move around it). Escape closes, ← → move.
 */
export function ViewingRoom({ works, index, onIndexChange, onClose }: ViewingRoomProps) {
  const art = works[index]!;
  const [open, setOpen] = useState(false);
  const [closer, setCloser] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const closingRef = useRef(false);

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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (closer) setCloser(false);
        else requestClose();
      } else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), [tabindex]:not([tabindex="-1"])');
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
  }, [go, requestClose, closer]);

  // Warm the neighbours so moving between paintings feels immediate.
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
  const many = works.length > 1;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={art.placeholder ? "Empty frame" : art.title}
      data-open={open || undefined}
      className="viewing-room fixed inset-0 z-[60]"
    >
      <div className="viewing-room-backdrop" aria-hidden onClick={requestClose} />

      <div className="viewing-stage pointer-events-none relative flex h-full items-center justify-center px-4 py-16 sm:px-24 sm:py-14">
        <div aria-hidden className="viewing-light" />
        <div
          key={art.id}
          className="viewing-picture pointer-events-auto relative"
          style={{ width: `min(100%, calc((100svh - 8rem) * ${fa.toFixed(4)}))` }}
        >
          <button
            type="button"
            className="block w-full cursor-zoom-in"
            onClick={() => !art.placeholder && setCloser(true)}
            aria-label="Look closer"
            disabled={art.placeholder}
          >
            <Frame art={art} sizes="(min-width: 640px) 80vw, 96vw" preload />
          </button>
        </div>
        {closer && !art.placeholder ? <CloserView art={art} onExit={() => setCloser(false)} /> : null}
      </div>

      {many && !closer ? (
        <>
          <button type="button" onClick={() => go(-1)} className="viewing-arrow left-2 sm:left-6" aria-label="Previous painting">
            <ChevronLeft size={30} strokeWidth={1} />
          </button>
          <button type="button" onClick={() => go(1)} className="viewing-arrow right-2 sm:right-6" aria-label="Next painting">
            <ChevronRight size={30} strokeWidth={1} />
          </button>
        </>
      ) : null}

      <button ref={closeRef} type="button" onClick={closer ? () => setCloser(false) : requestClose} className="viewing-close" aria-label={closer ? "Step back" : "Close"}>
        <X size={20} strokeWidth={1.2} />
      </button>
    </div>
  );
}

/** Full-resolution inspection: drag (or scroll) to move around the painting, click to step back. */
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
      aria-label="Close-up. Drag to move around the painting; click to step back."
      className="closer-view pointer-events-auto absolute inset-0 z-10 cursor-grab overflow-auto active:cursor-grabbing"
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
      <div className="grid min-h-full min-w-full place-items-center p-[10vmin]">
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
