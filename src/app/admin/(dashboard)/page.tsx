import Link from "next/link";
import { CollectionManager } from "@/components/admin/CollectionManager";
import { PageHeading } from "@/components/admin/PageHeading";
import { getAllArtworks } from "@/lib/admin-data";

export default async function CollectionPage() {
  const works = await getAllArtworks();
  return (
    <>
      <PageHeading
        title="The collection"
        lede="Drag paintings to change the order visitors walk past them. Principal works hang on their own walls in the first room; the rest hang together in the cabinet."
        actions={
          <Link href="/admin/works/new" className="admin-button admin-button-primary">
            Add a painting
          </Link>
        }
      />
      <CollectionManager initial={works} />
    </>
  );
}
