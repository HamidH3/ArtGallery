import { getCopyrightYear } from "@/lib/data";
import { ArtworkEditor } from "@/components/admin/ArtworkEditor";
import { PageHeading } from "@/components/admin/PageHeading";

export default async function NewWorkPage() {
  return (
    <>
      <PageHeading
        title="Add a painting"
        lede="Drop in a photo of the painting, choose a frame, give it a name and click Hang the painting. The preview shows how it will look on the wall."
      />
      <ArtworkEditor artwork={null} currentYear={await getCopyrightYear()} />
    </>
  );
}
