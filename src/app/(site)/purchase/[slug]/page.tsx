import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Frame } from "@/components/site/Frame";
import { PAPER } from "@/content/prints";
import { getArtworks } from "@/lib/data";
import { framedAspect } from "@/lib/hang";
import { publicImageUrl } from "@/lib/images";
import { isStripeConfigured } from "@/lib/stripe";
import { PrintPicker } from "../PrintPicker";
import { ShopSmallPrint } from "../ShopSmallPrint";

const PLACEHOLDER = "__none__";

async function forSale() {
  return (await getArtworks()).filter((w) => w.print_available && !w.placeholder);
}

export async function generateStaticParams() {
  const works = await forSale();
  return works.length ? works.map((w) => ({ slug: w.slug })) : [{ slug: PLACEHOLDER }];
}

export async function generateMetadata({ params }: PageProps<"/purchase/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const art = (await forSale()).find((w) => w.slug === slug);
  if (!art) return { title: "Not found" };
  const image = publicImageUrl(art.thumbnail_path || art.image_path);
  return {
    title: `${art.title}: print`,
    description: `${PAPER}, in three sizes.`,
    openGraph: { title: `${art.title}: print`, images: image ? [{ url: image, alt: art.alt_text ?? art.title }] : [] },
  };
}

export default async function PrintPage({ params }: PageProps<"/purchase/[slug]">) {
  const { slug } = await params;
  const art = (await forSale()).find((w) => w.slug === slug);
  if (!art) notFound();
  const fa = framedAspect(art);

  return (
    <div className="px-5 pt-[calc(var(--nav-h)+3rem)] pb-28 sm:px-10 lg:px-16">
      <div className="mx-auto grid max-w-[80rem] items-center gap-14 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-20">
        <div className="flex justify-center">
          <div className="picture-light w-full" style={{ maxWidth: `min(100%, calc(72svh * ${fa.toFixed(4)}))` }}>
            <Frame art={art} sizes="(min-width: 1024px) 50vw, 92vw" preload />
          </div>
        </div>

        <div className="mx-auto w-full max-w-[28rem] lg:mx-0">
          <Link href="/purchase" className="font-display text-[1.05rem] italic text-gold-pale hover:text-ivory">
            All prints
          </Link>
          <h1 className="mt-5 font-display text-[2.5rem] leading-[1.05] font-light text-ivory italic sm:text-[2.9rem]">{art.title}</h1>
          <p className="mt-3 text-[1.02rem] text-wall-text/75">{PAPER}.</p>
          <PrintPicker slug={art.slug} width={art.width} height={art.height} enabled={isStripeConfigured} />
        </div>
      </div>

      <ShopSmallPrint className="mt-28" />
    </div>
  );
}
