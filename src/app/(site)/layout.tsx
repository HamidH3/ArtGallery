import { Colophon } from "@/components/site/Colophon";
import { PreviewNote } from "@/components/site/PreviewNote";
import { SiteNav } from "@/components/site/SiteNav";
import { isSupabaseConfigured } from "@/lib/config";
import { getSiteSettings } from "@/lib/data";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const settings = await getSiteSettings();
  return (
    <>
      <SiteNav name={settings.artist_name} />
      <main id="main">{children}</main>
      <Colophon />
      {!isSupabaseConfigured ? (
        <PreviewNote />
      ) : null}
    </>
  );
}
