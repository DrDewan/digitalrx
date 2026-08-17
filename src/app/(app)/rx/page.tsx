import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/db/profile";
import { Workspace, type TemplateOption } from "@/components/rx/workspace";

export const metadata = { title: "Prescription — Digital Rx" };

export default async function RxPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();
  const { data: templates } = await supabase
    .from("templates")
    .select("id, name, description, content")
    .order("use_count", { ascending: false })
    .order("name")
    .limit(50);

  return (
    <Workspace
      boxes={profile.overlay_boxes}
      fontMax={profile.overlay_font_max}
      fontMin={profile.overlay_font_min}
      defaultLanguage={profile.default_language}
      templates={(templates ?? []) as TemplateOption[]}
    />
  );
}
