import { AboutEditor } from "@/components/admin/AboutEditor";
import { PageHeading } from "@/components/admin/PageHeading";
import { getAboutForEdit, getSettingsForEdit } from "@/lib/admin-data";

export default async function AboutAdminPage() {
  const [settings, sections] = await Promise.all([getSettingsForEdit(), getAboutForEdit()]);
  return (
    <>
      <PageHeading
        title="About page"
        lede="Your story, told in chapters. Add photographs of the studio or of work in progress, and a quotation or two between chapters."
      />
      <AboutEditor settings={settings} sections={sections} />
    </>
  );
}
