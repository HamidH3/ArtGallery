import type { Metadata, Viewport } from "next";
import { SITE_URL } from "@/lib/config";
import { getSiteSettings } from "@/lib/data";
import { cormorant, garamond } from "./fonts";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: `${s.artist_name}: Paintings`, template: `%s | ${s.artist_name}` },
    description: s.meta_description,
    openGraph: { type: "website", siteName: s.artist_name, title: s.artist_name, description: s.meta_description },
    twitter: { card: "summary_large_image" },
  };
}

export const viewport: Viewport = {
  themeColor: "#2a1d14",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-GB" className={`${cormorant.variable} ${garamond.variable}`}>
      <body className="min-h-svh">{children}</body>
    </html>
  );
}
