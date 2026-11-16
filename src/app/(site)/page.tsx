import { Closing } from "@/components/site/Closing";
import { GalleryRooms } from "@/components/site/GalleryRooms";
import { Hero } from "@/components/site/Hero";
import { Lozenge } from "@/components/site/Ornaments";
import { WallText } from "@/components/site/WallText";
import { getArtworks, getSiteSettings } from "@/lib/data";
import { hangCabinet, hangPrincipal } from "@/lib/hang";

export default async function GalleryPage() {
  const [settings, works] = await Promise.all([getSiteSettings(), getArtworks()]);
  const principal = hangPrincipal(works.filter((w) => w.is_featured));
  const cabinet = hangCabinet(works.filter((w) => !w.is_featured));

  return (
    <>
      <Hero name={settings.artist_name} kicker={settings.hero_kicker} statement={settings.hero_statement} />
      <WallText heading={settings.intro_heading} body={settings.intro_body} works={works} />
      {works.length > 0 ? (
        <GalleryRooms
          principal={principal}
          cabinet={cabinet}
          roomOneTitle={settings.room_one_title}
          roomTwoTitle={settings.room_two_title}
        />
      ) : (
        <section className="surface-parchment px-6 pb-36 text-center">
          <Lozenge className="mx-auto text-gold" />
          <h2 className="mt-8 font-display text-[2.2rem] font-light">The collection is being hung</h2>
          <p className="mx-auto mt-4 max-w-[28rem] text-[1.1rem] text-ink/75">
            The first paintings will appear here shortly. Please come back soon.
          </p>
        </section>
      )}
      <Closing settings={settings} />
    </>
  );
}
