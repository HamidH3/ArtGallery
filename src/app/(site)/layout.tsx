import Image from "next/image";
import { Colophon } from "@/components/site/Colophon";
import { PreviewNote } from "@/components/site/PreviewNote";
import { SiteNav } from "@/components/site/SiteNav";
import { isSupabaseConfigured } from "@/lib/config";
import { getSiteSettings } from "@/lib/data";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const settings = await getSiteSettings();
  return (
    <>
      {/* The old building behind everything: a carved Romanesque doorway, faded into the dark */}
      <div className="site-backdrop" aria-hidden>
        <Image src="/backdrop/old-doorway.jpg" alt="" fill sizes="100vw" quality={70} className="object-cover object-[50%_40%]" />
      </div>
      <SiteNav name={settings.artist_name} />
      <main id="main" className="relative">
        {children}
      </main>
      <Colophon />
      {!isSupabaseConfigured ? <PreviewNote /> : null}
    </>
  );
}
