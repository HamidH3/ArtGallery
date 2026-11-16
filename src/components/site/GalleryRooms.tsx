"use client";

import { WindowLight } from "./WindowLight";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toRoman } from "@/lib/format";
import type { CabinetRow, PrincipalWall } from "@/lib/hang";
import { framedAspect } from "@/lib/hang";
import type { Artwork } from "@/lib/types";
import { Frame } from "./Frame";
import { Lozenge } from "./Ornaments";
import { useLightsUp } from "./useLightsUp";
import { ViewingRoom } from "./ViewingRoom";
import { WallLabel } from "./WallLabel";

interface GalleryRoomsProps {
  principal: PrincipalWall[];
  cabinet: CabinetRow[];
  roomOneTitle: string;
  roomTwoTitle: string;
}

/**
 * The two rooms of the gallery and the viewing room that opens over them.
 * Opening a work pushes /works/<slug> onto the history, so the link can be shared and the
 * browser's back button returns the visitor to exactly the same place on the wall.
 */
export function GalleryRooms({ principal, cabinet, roomOneTitle, roomTwoTitle }: GalleryRoomsProps) {
  // Viewing order follows the walk through the rooms.
  const sequence = useMemo(
    () => [...principal.map((p) => p.art), ...cabinet.flatMap((r) => r.works.map((w) => w.art))],
    [principal, cabinet],
  );
  const [active, setActive] = useState<number | null>(null);
  const pushed = useRef(false);
  const opener = useRef<HTMLElement | null>(null);

  const open = useCallback(
    (art: Artwork, trigger: HTMLElement) => {
      const i = sequence.findIndex((a) => a.id === art.id);
      if (i < 0) return;
      opener.current = trigger;
      setActive(i);
      if (!art.placeholder) {
        window.history.pushState({ viewing: art.slug }, "", `/works/${art.slug}`);
        pushed.current = true;
      }
    },
    [sequence],
  );

  const changeIndex = useCallback(
    (i: number) => {
      setActive(i);
      const art = sequence[i];
      if (art && !art.placeholder && pushed.current) {
        window.history.replaceState({ viewing: art.slug }, "", `/works/${art.slug}`);
      }
    },
    [sequence],
  );

  const close = useCallback(() => {
    setActive(null);
    if (pushed.current) {
      pushed.current = false;
      window.history.back();
    }
    // Return focus to the painting the visitor opened.
    requestAnimationFrame(() => opener.current?.focus({ preventScroll: true }));
  }, []);

  // Back / forward buttons.
  useEffect(() => {
    const onPop = () => {
      const m = window.location.pathname.match(/^\/works\/([^/]+)/);
      if (!m) {
        pushed.current = false;
        setActive(null);
        return;
      }
      const i = sequence.findIndex((a) => a.slug === decodeURIComponent(m[1]!));
      if (i >= 0) {
        pushed.current = true;
        setActive(i);
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [sequence]);

  const hasPrincipal = principal.length > 0;
  const hasCabinet = cabinet.length > 0;

  return (
    <>
      {hasPrincipal ? (
        <section aria-labelledby="room-principal" className="relative">
          {/* The room's painted vault: a bay of Michelangelo's Sistine ceiling, seen overhead */}
          <div className="painted-vault" aria-hidden>
            <Image src="/fresco/sistine-vault.jpg" alt="" fill sizes="100vw" quality={70} className="object-cover object-center" />
          </div>
          <div className="cornice" aria-hidden />
          <div className="surface-wall on-dark relative pt-24 pb-28 sm:pt-32 md:pb-40">
            <WindowLight />
            <div className="relative z-[1]">
              <RoomHeading id="room-principal" numeral={1} title={roomOneTitle} tone="dark" />
              <div className="mx-auto mt-20 max-w-[90rem] space-y-28 px-6 sm:mt-28 sm:space-y-40 sm:px-10 lg:px-16">
                {principal.map((wall, i) => (
                  <PrincipalWallView key={wall.art.id} wall={wall} first={i === 0} onOpen={open} />
                ))}
              </div>
            </div>
          </div>
          <div className="dado" aria-hidden />
          <div className="surface-walnut panel-inset h-16 sm:h-24" aria-hidden />
        </section>
      ) : null}

      {hasCabinet ? (
        <section aria-labelledby="room-cabinet" className="surface-parchment relative isolate pt-28 pb-24 sm:pt-36 sm:pb-36">
          <WindowLight soft />
          <RoomHeading
            id="room-cabinet"
            numeral={hasPrincipal ? 2 : 1}
            title={hasPrincipal ? roomTwoTitle : roomOneTitle}
            tone="light"
          />
          <div className="mx-auto mt-20 max-w-[84rem] space-y-24 px-6 sm:mt-28 sm:px-10 md:space-y-36 lg:px-16">
            {cabinet.map((row) => (
              <CabinetRowView key={row.key} row={row} onOpen={open} />
            ))}
          </div>
        </section>
      ) : null}

      {active !== null && sequence[active] ? (
        <ViewingRoom works={sequence} index={active} onIndexChange={changeIndex} onClose={close} />
      ) : null}
    </>
  );
}

function RoomHeading({ id, numeral, title, tone }: { id: string; numeral: number; title: string; tone: "dark" | "light" }) {
  return (
    <header className="px-6 text-center">
      <p className={`font-display text-[1.3rem] italic ${tone === "dark" ? "text-gold-pale/85" : "text-umber"}`}>
        Room {toRoman(numeral)}
      </p>
      <h2
        id={id}
        className={`mt-3 font-display text-[2.6rem] leading-none font-light sm:text-[3.6rem] ${
          tone === "dark" ? "text-ivory" : "text-ink"
        }`}
      >
        {title}
      </h2>
      <Lozenge className={`mx-auto mt-6 ${tone === "dark" ? "text-gold-light/70" : "text-gold"}`} />
    </header>
  );
}

type OpenFn = (art: Artwork, trigger: HTMLElement) => void;

function PrincipalWallView({ wall, first, onOpen }: { wall: PrincipalWall; first: boolean; onOpen: OpenFn }) {
  const { art, labelSide, widthPct } = wall;
  const ref = useLightsUp<HTMLDivElement>();
  const fa = framedAspect(art);
  const pictureLeft = labelSide === "right";

  return (
    <article className="grid items-center gap-y-8 md:grid-cols-12 md:gap-x-8" aria-label={art.title}>
      <div
        className={`md:col-span-8 ${pictureLeft ? "md:col-start-1" : "md:col-start-5 md:row-start-1"} flex justify-center`}
      >
        <div
          ref={ref}
          className="hang-reveal picture-light w-full"
          style={{ maxWidth: `min(${widthPct}%, calc(80svh * ${fa.toFixed(4)}))` }}
        >
          <WorkButton art={art} onOpen={onOpen}>
            <Frame art={art} sizes="(min-width: 768px) 58vw, 92vw" preload={first} />
          </WorkButton>
        </div>
      </div>
      <div
        className={`md:col-span-4 lg:col-span-3 ${
          pictureLeft ? "md:col-start-9" : "md:col-start-1 md:row-start-1"
        } flex md:self-end md:pb-[6%] ${pictureLeft ? "" : "md:justify-end"}`}
      >
        <WallLabel art={art} variant="plaque" withNote className="w-full max-w-[19rem]" />
      </div>
    </article>
  );
}

function CabinetRowView({ row, onOpen }: { row: CabinetRow; onOpen: OpenFn }) {
  return (
    <div className="cabinet-row flex flex-col gap-20 md:flex-row md:items-center md:justify-center md:gap-[5%] md:pb-28">
      {row.works.map((w) => (
        <CabinetWork key={w.art.id} hung={w} onOpen={onOpen} />
      ))}
    </div>
  );
}

function CabinetWork({ hung, onOpen }: { hung: CabinetRow["works"][number]; onOpen: OpenFn }) {
  const ref = useLightsUp<HTMLDivElement>();
  const fa = framedAspect(hung.art);
  return (
    <div
      className="cabinet-item relative"
      style={
        {
          "--w": `min(${hung.widthPct}%, calc(62svh * ${fa.toFixed(4)}))`,
          "--w-sm": `${hung.mobilePct}%`,
        } as React.CSSProperties
      }
    >
      <div ref={ref} className="hang-reveal">
        <WorkButton art={hung.art} onOpen={onOpen}>
          <Frame art={hung.art} sizes={`(min-width: 768px) ${Math.ceil(hung.widthPct)}vw, ${hung.mobilePct}vw`} />
        </WorkButton>
      </div>
      <WallLabel art={hung.art} className="cabinet-caption mt-5 text-ink md:absolute md:inset-x-0 md:top-full" />
    </div>
  );
}

function WorkButton({ art, onOpen, children }: { art: Artwork; onOpen: OpenFn; children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="work-button group block w-full cursor-zoom-in text-left"
      onClick={(e) => onOpen(art, e.currentTarget)}
      aria-label={`View ${art.title}${art.year ? `, ${art.year}` : ""}`}
    >
      {children}
    </button>
  );
}
