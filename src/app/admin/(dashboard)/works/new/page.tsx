import { getCopyrightYear } from "@/lib/data";
import { ArtworkEditor } from "@/components/admin/ArtworkEditor";
import { PageHeading } from "@/components/admin/PageHeading";

export default async function NewWorkPage() {
  return (
    <>
      <PageHeading
        title="Add a painting"
        lede="Upload a photograph, add the label details and choose a frame. The preview shows how it will look on the wall."
      />
      <ArtworkEditor artwork={null} currentYear={await getCopyrightYear()} />
    </>
  );
}
