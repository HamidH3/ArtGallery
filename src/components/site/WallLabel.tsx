import type { Artwork } from "@/lib/types";

interface WallLabelProps {
  art: Artwork;
  /** "plaque" is the printed card beside a principal work; "caption" is the quieter text under cabinet works. */
  variant?: "plaque" | "caption";
  /** Show the curatorial note (principal works only, truncated to its first paragraph). */
  withNote?: boolean;
  className?: string;
  titleAs?: "h3" | "p";
}

/** A museum wall label: title and date, medium, dimensions, and an optional short note. */
export function WallLabel({ art, variant = "caption", withNote, className = "", titleAs: Title = "h3" }: WallLabelProps) {
  const note = withNote && art.description ? art.description.split(/\n\s*\n/)[0] : null;

  return (
    <div className={`${variant === "plaque" ? "wall-label px-5 pt-4 pb-5" : ""} ${className}`}>
      <Title className="font-display text-[1.32rem] leading-[1.15] font-medium">
        <span className="italic">{art.title}</span>
        {art.year ? <span className="font-normal">, {art.year}</span> : null}
      </Title>
      {art.medium ? <p className="mt-1 text-[0.95rem] leading-snug opacity-80">{art.medium}</p> : null}
      {art.dimensions ? <p className="text-[0.95rem] leading-snug opacity-80 tabular-nums">{art.dimensions}</p> : null}
      {note ? (
        <p className="mt-3 border-t border-current/15 pt-3 text-[0.95rem] leading-relaxed line-clamp-6">{note}</p>
      ) : null}
    </div>
  );
}
