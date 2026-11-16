import { WindowLight } from "@/components/site/WindowLight";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Lozenge } from "@/components/site/Ornaments";
import { getAboutSections, getSiteSettings } from "@/lib/data";
import { initials, parseProse, toRoman } from "@/lib/format";
import { publicImageUrl } from "@/lib/images";
import type { AboutSection } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  return { title: "About", description: s.about_lede.slice(0, 200) };
}

export default async function AboutPage() {
  const [s, sections] = await Promise.all([getSiteSettings(), getAboutSections()]);
  let chapterNo = 0;

  return (
    <div className="surface-parchment relative isolate">
      <WindowLight soft />
      {/* Opening */}
      <header className="mx-auto grid max-w-[78rem] items-center gap-14 px-6 pt-[calc(var(--nav-h)+4rem)] pb-24 sm:px-10 sm:pt-[calc(var(--nav-h)+6rem)] md:grid-cols-12 md:gap-x-10 lg:px-16 lg:pb-32">
        <figure className="mx-auto w-full max-w-[24rem] md:col-span-5 md:max-w-none">
          <div className="arch-frame">
            <div className="arch-frame-inner" style={{ aspectRatio: "4 / 5" }}>
              {s.about_portrait_path ? (
                <Image
                  src={publicImageUrl(s.about_portrait_path)}
                  alt={s.about_portrait_caption || `Portrait of ${s.artist_name}`}
                  fill
                  preload
                  sizes="(min-width: 768px) 36vw, 90vw"
                  quality={86}
                  className="object-cover"
                />
              ) : (
                <div className="arch-frame-empty" aria-hidden>
                  <span className="font-display text-[4.5rem] font-light italic text-gold" aria-hidden>{initials(s.artist_name)}</span>
                </div>
              )}
            </div>
          </div>
          {s.about_portrait_caption ? (
            <figcaption className="mt-4 text-center text-[0.95rem] italic text-umber">{s.about_portrait_caption}</figcaption>
          ) : null}
        </figure>

        <div className="md:col-span-6 md:col-start-7">
          <p className="font-display text-[1.25rem] italic text-burgundy">{s.about_kicker}</p>
          <h1 className="mt-4 font-display text-[3rem] leading-[1.02] font-light text-ink sm:text-[4.2rem]">{s.about_title}</h1>
          <p className="mt-8 max-w-[32rem] font-display text-[1.45rem] leading-[1.45] text-ink/85 italic">{s.about_lede}</p>
        </div>
      </header>

      <div className="mx-auto max-w-[78rem] px-6 sm:px-10 lg:px-16">
        <Lozenge className="mx-auto text-gold" />
      </div>

      {/* The story */}
      <div className="mx-auto max-w-[72rem] space-y-24 px-6 pt-24 pb-32 sm:px-10 sm:space-y-32 lg:px-16">
        {sections.map((section) => {
          if (section.kind === "quote") return <Quotation key={section.id} section={section} />;
          chapterNo += 1;
          return <Chapter key={section.id} section={section} numeral={chapterNo} first={chapterNo === 1} />;
        })}

        <footer className="mx-auto max-w-[34rem] pt-4 text-center">
          <p className="font-display text-[2rem] font-light italic text-ink">{s.artist_name}</p>
          <Link href="/#collection" className="mt-6 inline-block font-display text-[1.2rem] italic text-burgundy link-underlined">
            Return to the gallery
          </Link>
        </footer>
      </div>
    </div>
  );
}

function Chapter({ section, numeral, first }: { section: AboutSection; numeral: number; first: boolean }) {
  const blocks = parseProse(section.body);
  const img = section.image_path
    ? {
        src: publicImageUrl(section.image_path),
        w: section.image_width ?? 1600,
        h: section.image_height ?? 1200,
      }
    : null;
  const tall = img ? img.h > img.w : false;

  return (
    <section className="grid gap-y-6 md:grid-cols-12 md:gap-x-10" aria-labelledby={`chapter-${section.id}`}>
      <header className="md:col-span-3 md:pt-1.5 md:text-right lg:col-span-3">
        <p className="font-display text-[1.15rem] italic text-burgundy/85">{toRoman(numeral)}</p>
        {section.heading ? (
          <h2 id={`chapter-${section.id}`} className="mt-1 font-display text-[1.9rem] leading-[1.1] font-medium text-ink">
            {section.heading}
          </h2>
        ) : null}
      </header>

      <div className={`prose-gallery max-w-[38rem] md:col-span-7 lg:col-span-6 ${first ? "drop-cap-first" : ""}`}>
        {blocks.map((b, i) =>
          b.type === "p" ? (
            <p key={i} className="text-[1.15rem] leading-[1.75] text-ink/90">
              {b.text}
            </p>
          ) : (
            <ul key={i} className="about-list my-6">
              {b.items.map((item, j) => (
                <li key={j}>{item}</li>
              ))}
            </ul>
          ),
        )}
      </div>

      {img ? (
        <figure className={tall ? "md:col-span-3 md:pt-2" : "md:col-span-9 md:col-start-4 md:mt-8"}>
          <div className="photo-mount">
            <Image
              src={img.src}
              alt={section.image_caption || ""}
              width={img.w}
              height={img.h}
              sizes={tall ? "(min-width: 768px) 22vw, 90vw" : "(min-width: 768px) 60vw, 90vw"}
              quality={86}
              className="block h-auto w-full"
            />
          </div>
          {section.image_caption ? (
            <figcaption className="mt-3 text-[0.95rem] leading-snug italic text-umber">{section.image_caption}</figcaption>
          ) : null}
        </figure>
      ) : null}
    </section>
  );
}

function Quotation({ section }: { section: AboutSection }) {
  return (
    <figure className="mx-auto max-w-[44rem] text-center">
      <Lozenge className="mx-auto text-gold/80" />
      <blockquote className="mt-8 font-display text-[1.9rem] leading-[1.3] font-light text-ink italic sm:text-[2.4rem]">
        <p>{section.body}</p>
      </blockquote>
      <Lozenge className="mx-auto mt-8 text-gold/80" />
    </figure>
  );
}
