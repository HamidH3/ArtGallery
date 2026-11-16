import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";
import { getArtworks } from "@/lib/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const works = (await getArtworks()).filter((w) => !w.placeholder);
  return [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.7 },
    ...works.map((w) => ({ url: `${SITE_URL}/works/${w.slug}`, lastModified: w.updated_at, priority: 0.6 })),
  ];
}
