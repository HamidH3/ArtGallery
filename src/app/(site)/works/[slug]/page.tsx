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
  const image = publicImageUrl(art.thumbnail_path || art.image_path);
  return {
    title: art.title,
    alternates: { canonical: `/works/${art.slug}` },
    openGraph: { title: art.title, images: image ? [{ url: image, alt: art.alt_text ?? art.title }] : [] },
  };
}

/** A painting's own page, for shared links: just the painting, with a way back. */
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
    <article className="relative flex min-h-svh flex-col items-center justify-center px-5 pt-[calc(var(--nav-h)+2rem)] pb-16 sm:px-10">
      <h1 className="sr-only">{art.title}</h1>
      <div className="picture-light w-full" style={{ maxWidth: `min(92vw, 1320px, calc((100svh - var(--nav-h) - 10rem) * ${fa.toFixed(4)}))` }}>
        <Frame art={art} sizes="(min-width: 768px) 80vw, 94vw" preload />
      </div>
      <nav aria-label="More paintings" className="mt-12 flex items-center gap-10 font-display text-[1.15rem] italic text-gold-pale">
        {prev ? <Link href={`/works/${prev.slug}`} className="hover:text-ivory">Previous</Link> : null}
        <Link href="/#collection" className="hover:text-ivory">Back to the gallery</Link>
        {next ? <Link href={`/works/${next.slug}`} className="hover:text-ivory">Next</Link> : null}
      </nav>
    </article>
  );
}
