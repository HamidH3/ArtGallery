import { countWords } from "@/lib/format";
import type { Artwork } from "@/lib/types";

interface WallTextProps {
  heading: string;
  body: string;
  works: Artwork[];
}

/** The introductory wall text at the entrance to the rooms, as a curator would write it. */
export function WallText({ heading, body, works }: WallTextProps) {
  const paragraphs = body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const real = works.filter((w) => !w.placeholder);
  const years = real.map((w) => w.year).filter((y): y is number => typeof y === "number");
  const span =
    years.length > 0
      ? Math.min(...years) === Math.max(...years)
        ? `${Math.min(...years)}`
        : `${Math.min(...years)} to ${Math.max(...years)}`
      : null;
  const count = real.length;
  const tally =
    count > 0
      ? `${capitalise(countWords(count))} ${count === 1 ? "work" : "works"}${span ? `, ${span}` : ""}`
      : null;

  return (
    <section id="collection" className="surface-parchment relative scroll-mt-0 px-6 pt-28 pb-28 sm:px-10 sm:pt-36 sm:pb-36 lg:px-16">
      <div className="mx-auto grid max-w-[72rem] gap-12 md:grid-cols-12 md:gap-x-10">
        <div className="md:col-span-5">
          <h2 className="font-display text-[2.5rem] leading-[1.05] font-light text-ink sm:text-[3.2rem]">{heading}</h2>
          {tally ? <p className="mt-5 font-display text-[1.2rem] italic text-umber">{tally}</p> : null}
        </div>
        <div className="wall-text-body md:col-span-6 md:col-start-7 md:pt-3">
          {paragraphs.map((p, i) => (
            <p key={i} className={i === 0 ? "text-[1.28rem] leading-[1.6] text-ink" : "mt-5 text-[1.1rem] leading-[1.7] text-ink/80"}>
              {p}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

function capitalise(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
