import type { Metadata } from "next";
import Link from "next/link";
import { Frame } from "@/components/site/Frame";
import { Lozenge } from "@/components/site/Ornaments";
import { formatPrice, LOWEST_PRICE, SHOP_INTRO } from "@/content/prints";
import { getArtworks } from "@/lib/data";
import { framedAspect } from "@/lib/hang";
import { ShopSmallPrint } from "./ShopSmallPrint";

export const metadata: Metadata = {
  title: "Purchase prints",
  description: SHOP_INTRO,
};

export default async function PurchasePage() {
  const works = (await getArtworks()).filter((w) => w.print_available && !w.placeholder);

  return (
    <div className="px-5 pt-[calc(var(--nav-h)+4.5rem)] pb-28 sm:px-10 lg:px-16">
      <header className="mx-auto max-w-[36rem] text-center">
        <h1 className="font-display text-[2.8rem] leading-none font-light text-ivory sm:text-[3.6rem]">Prints</h1>
        <Lozenge className="mx-auto mt-6 text-gold-light/75" />
        <p className="mt-6 text-[1.12rem] leading-[1.7] text-wall-text/85">{SHOP_INTRO}</p>
        <p className="mt-2 font-display text-[1.15rem] italic text-gold-pale">Choose a painting to see the sizes.</p>
      </header>

      {works.length ? (
        <ul className="shop-grid mx-auto mt-20 grid max-w-[76rem] gap-x-10 gap-y-20 sm:mt-24 sm:grid-cols-2 lg:grid-cols-3">
          {works.map((art, i) => (
            <li key={art.id} className="flex flex-col items-center">
              <Link href={`/purchase/${art.slug}`} className="shop-item group flex w-full flex-col items-center" aria-label={`${art.title}, prints from ${formatPrice(LOWEST_PRICE)}`}>
                <div className="flex h-[min(24rem,70vw)] w-full items-center justify-center">
                  <div className="picture-light" style={{ width: `min(100%, calc(min(24rem, 70vw) * ${framedAspect(art).toFixed(4)}))` }}>
                    <Frame art={art} sizes="(min-width: 1024px) 26vw, (min-width: 640px) 44vw, 88vw" preload={i < 3} />
                  </div>
                </div>
                <p className="mt-7 text-center font-display text-[1.35rem] leading-tight italic text-ivory group-hover:text-gold-pale">{art.title}</p>
                <p className="mt-1 text-[0.98rem] text-wall-muted">Prints from {formatPrice(LOWEST_PRICE)}</p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mx-auto mt-20 max-w-[30rem] text-center font-display text-[1.4rem] font-light italic text-wall-text/75">
          No prints are available just yet. Please check back soon.
        </p>
      )}

      <ShopSmallPrint className="mt-28" />
    </div>
  );
}
