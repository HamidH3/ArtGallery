import { aspect, frameAllowance, resolveFrame } from "./images";
import type { Artwork } from "./types";

/**
 * The hang: how works are arranged on the gallery walls.
 *
 * Principal (featured) works each get a wall to themselves, alternating which side their label sits.
 * Everything else is hung "on the line" in the cabinet: small groups of two or three, different sizes,
 * all sharing a common centre line, the way pictures are hung in a real gallery.
 */

export interface HungWork {
  art: Artwork;
  /** Width of the framed work as a percentage of the row (desktop). */
  widthPct: number;
  /** Relative visual weight inside its row (1 = the anchor of the group). */
  scale: number;
  /** Width on narrow screens, where works hang one above another. */
  mobilePct: number;
}

export interface CabinetRow {
  key: string;
  works: HungWork[];
}

export interface PrincipalWall {
  art: Artwork;
  labelSide: "left" | "right";
  /** Framed width as a percentage of the wall's picture column. */
  widthPct: number;
}

/** Framed aspect ratio (frames add to both dimensions). */
export function framedAspect(art: Artwork) {
  const ar = aspect(art);
  const f = frameAllowance(resolveFrame(art));
  return (ar + f) / (1 + f * ar);
}

export function hangPrincipal(works: Artwork[]): PrincipalWall[] {
  return works.map((art, i) => {
    const ar = framedAspect(art);
    // Landscapes take most of the column; portraits are held back so they don't tower.
    const widthPct = Math.round(Math.min(100, Math.max(52, ar * 70)));
    return { art, labelSide: i % 2 === 0 ? "right" : "left", widthPct };
  });
}

/** Group sizes cycle so the rhythm of the walls never settles into a grid. */
const RHYTHM = [3, 2, 2, 3, 1, 2];

export function hangCabinet(works: Artwork[]): CabinetRow[] {
  const rows: CabinetRow[] = [];
  let i = 0;
  let r = 0;
  while (i < works.length) {
    let size = RHYTHM[r % RHYTHM.length]!;
    const remaining = works.length - i;
    if (remaining - size === 1) size = remaining <= 3 ? remaining : size - 1;
    size = Math.min(size, remaining);
    // A very wide picture is happier hanging with at most one companion.
    const slice = works.slice(i, i + size);
    if (size === 3 && slice.some((a) => framedAspect(a) > 1.7)) size = 2;
    const group = works.slice(i, i + size);
    rows.push({ key: group.map((g) => g.id).join("-"), works: sizeRow(group, r) });
    i += size;
    r++;
  }
  return rows;
}

function sizeRow(group: Artwork[], rowIndex: number): HungWork[] {
  // Choose visual heights: the anchor is full height, companions a little smaller.
  const heights = group.map((_, idx) => {
    if (group.length === 1) return 1;
    if (group.length === 2) return (idx + rowIndex) % 2 === 0 ? 1 : 0.78;
    return idx === 1 ? 1 : 0.7;
  });
  const widths = group.map((a, idx) => heights[idx]! * framedAspect(a));
  const total = widths.reduce((s, w) => s + w, 0);

  // Fill target leaves generous wall between works; also cap the tallest at ~48% of row width.
  const fill = group.length === 1 ? 0.56 : group.length === 2 ? 0.74 : 0.82;
  const scaleByWidth = fill / total;
  const scaleByHeight = 0.5 / Math.max(...heights);
  const s = Math.min(scaleByWidth, scaleByHeight);

  return group.map((art, idx) => ({
    art,
    scale: heights[idx]!,
    widthPct: +(widths[idx]! * s * 100).toFixed(2),
    mobilePct: mobileWidth(art, heights[idx]!),
  }));
}

/** On a phone the hang becomes a single column; portraits are held narrower so each fits on screen. */
function mobileWidth(art: Artwork, scale: number) {
  const ar = framedAspect(art);
  const base = ar >= 1.25 ? 94 : ar >= 0.95 ? 84 : 74;
  return Math.round(base * (scale < 1 ? 0.92 : 1));
}
