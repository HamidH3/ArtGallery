import { getCopyrightYear } from "@/lib/data";
import { notFound } from "next/navigation";
import { ArtworkEditor } from "@/components/admin/ArtworkEditor";
import { PageHeading } from "@/components/admin/PageHeading";
import { getArtworkById } from "@/lib/admin-data";

export default async function EditWorkPage({ params }: PageProps<"/admin/works/[id]">) {
  const { id } = await params;
  const artwork = await getArtworkById(id);
  if (!artwork) notFound();
  return (
    <>
      <PageHeading
        title={artwork.title}
        lede={
          artwork.is_published ? (
            <>
              On view at{" "}
              <a href={`/works/${artwork.slug}`} target="_blank" rel="noreferrer" className="link-underlined">
                /works/{artwork.slug}
              </a>
            </>
          ) : (
            "Hidden from visitors"
          )
        }
      />
      <ArtworkEditor key={artwork.updated_at} artwork={artwork} currentYear={await getCopyrightYear()} />
    </>
  );
}
