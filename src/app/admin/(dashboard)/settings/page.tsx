import { PageHeading } from "@/components/admin/PageHeading";
import { SettingsEditor } from "@/components/admin/SettingsEditor";
import { getSettingsForEdit } from "@/lib/admin-data";

export default async function SettingsPage() {
  const settings = await getSettingsForEdit();
  return (
    <>
      <PageHeading title="Site details" lede="Your name at the entrance and any links you want in the footer. The About page text lives in the code; ask Claude to change it." />
      <SettingsEditor settings={settings} />
    </>
  );
}
