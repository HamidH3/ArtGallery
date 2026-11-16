import { GalleryScroll } from "@/components/site/GalleryScroll";
import { Hero } from "@/components/site/Hero";
import { getArtworks, getSiteSettings } from "@/lib/data";

export default async function GalleryPage() {
  const [settings, works] = await Promise.all([getSiteSettings(), getArtworks()]);

  return (
    <>
      <Hero name={settings.artist_name} kicker={settings.hero_kicker} />
      {works.length > 0 ? (
        <GalleryScroll works={works} />
      ) : (
        <section id="collection" className="px-6 py-40 text-center">
          <p className="font-display text-[1.6rem] font-light italic text-wall-text/80">The first paintings will be hung here soon.</p>
        </section>
      )}
    </>
  );
}
