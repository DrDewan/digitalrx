import { redirect } from "next/navigation";
import { getProfile } from "@/lib/db/profile";
import { PageHeader } from "@/components/page-header";
import { SettingsForm } from "@/app/(app)/settings/settings-form";

export const metadata = { title: "Settings — Digital Rx" };

export default async function SettingsPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  return (
    <div className="p-4">
      <PageHeader
        title="Settings"
        description="Prescriber details, working language, and the millimetre calibration of the hospital pad."
      />
      <SettingsForm profile={profile} />
    </div>
  );
}
