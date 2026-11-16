import { PageHeading } from "@/components/admin/PageHeading";
import { SettingsEditor } from "@/components/admin/SettingsEditor";
import { getSettingsForEdit } from "@/lib/admin-data";

export default async function SettingsPage() {
  const settings = await getSettingsForEdit();
  return (
    <>
      <PageHeading title="Site details" lede="The words around the paintings: your name, the entrance, the wall text and how visitors can reach you." />
      <SettingsEditor settings={settings} />
    </>
  );
}
