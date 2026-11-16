import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Frame } from "@/components/site/Frame";
import { getArtworkBySlug, getArtworks } from "@/lib/data";
import { framedAspect } from "@/lib/hang";
import { publicImageUrl } from "@/lib/images";

const PLACEHOLDER = "__none__";

export async function generateStaticParams() {
  const works = (await getArtworks()).filter((w) => !w.placeholder);
  // Cache Components needs at least one entry; unknown slugs fall through to notFound().
  return works.length ? works.map((w) => ({ slug: w.slug })) : [{ slug: PLACEHOLDER }];
}

export async function generateMetadata({ params }: PageProps<"/works/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const art = await getArtworkBySlug(slug);
  if (!art || art.placeholder) return { title: "Not found" };
  const description =
    art.description?.split(/\n\s*\n/)[0]?.slice(0, 200) ?? [art.medium, art.year].filter(Boolean).join(", ");
  const image = publicImageUrl(art.thumbnail_path || art.image_path);
  return {
    title: art.title,
    description,
    alternates: { canonical: `/works/${art.slug}` },
    openGraph: { title: art.title, description, images: image ? [{ url: image, alt: art.alt_text ?? art.title }] : [] },
  };
}

/** A painting's own page: what a shared link or a search result opens. Inside the gallery, the viewing room is used instead. */
export default async function WorkPage({ params }: PageProps<"/works/[slug]">) {
  const { slug } = await params;
  const works = (await getArtworks()).filter((w) => !w.placeholder);
  const index = works.findIndex((w) => w.slug === slug);
  if (index < 0) notFound();
  const art = works[index]!;
  const prev = works.length > 1 ? works[(index - 1 + works.length) % works.length] : null;
  const next = works.length > 1 ? works[(index + 1) % works.length] : null;
  const fa = framedAspect(art);

  return (
    <article className="work-page on-dark relative grid min-h-svh lg:grid-cols-[minmax(0,1fr)_25rem]">
      <div className="viewing-stage relative flex min-h-[70svh] items-center justify-center px-5 pt-[calc(var(--nav-h)+2rem)] pb-10 sm:px-10 lg:px-16 lg:pb-14">
        <div aria-hidden className="viewing-light" />
        <div className="relative w-full" style={{ maxWidth: `min(100%, calc((100svh - var(--nav-h) - 6rem) * ${fa.toFixed(4)}))` }}>
          <Frame art={art} sizes="(min-width: 1024px) 68vw, 94vw" preload />
        </div>
      </div>

      <div className="viewing-aside flex flex-col px-6 pt-8 pb-14 sm:px-10 lg:pt-[calc(var(--nav-h)+4rem)]">
        <Link href="/#collection" className="viewing-control self-start">
          Return to the gallery
        </Link>
        <h1 className="mt-10 font-display text-[2.6rem] leading-[1.05] font-medium text-ivory italic sm:text-[2.9rem]">{art.title}</h1>
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
        {prev && next ? (
          <nav aria-label="More works" className="mt-auto flex items-center justify-between gap-6 border-t border-gold/25 pt-5">
            <Link href={`/works/${prev.slug}`} className="viewing-control">
              Previous
            </Link>
            <Link href={`/works/${next.slug}`} className="viewing-control">
              Next
            </Link>
          </nav>
        ) : null}
      </div>
    </article>
  );
}
