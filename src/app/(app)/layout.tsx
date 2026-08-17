import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { getProfile } from "@/lib/db/profile";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect("/login");

  const profile = await getProfile();

  return (
    <AppShell
      doctorName={profile?.doctor_name || user.email || "Doctor"}
      clinicName={profile?.clinic_name || ""}
      language={profile?.default_language ?? "en"}
    >
      {children}
    </AppShell>
  );
}
