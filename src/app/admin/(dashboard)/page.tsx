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
        lede="Visitors scroll past your paintings in this order, top to bottom. Drag a painting (or use the arrows) to move it."
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
