import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/db/profile";
import { migrateDraft } from "@/lib/rx/types";
import { Workspace, type TemplateOption } from "@/components/rx/workspace";

export const metadata = { title: "Prescription — Digital Rx" };

/**
 * Opens a saved prescription back into the workspace, exactly as it was
 * issued. Saving again updates that record; use "Open as new" from the list
 * to start a fresh one from the same content.
 */
export default async function EditRxPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ copy?: string }>;
}) {
  const { id } = await params;
  const { copy } = await searchParams;

  const profile = await getProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();
  const { data: record } = await supabase
    .from("prescriptions")
    .select("id, serial, content")
    .eq("id", id)
    .maybeSingle();

  if (!record) notFound();

  const { data: templates } = await supabase
    .from("templates")
    .select("id, name, description, content")
    .order("use_count", { ascending: false })
    .limit(50);

  const isCopy = copy === "1";
  const draft = migrateDraft(record.content, profile.default_language);

  return (
    <Workspace
      boxes={profile.overlay_boxes}
      fontMax={profile.overlay_font_max}
      fontMin={profile.overlay_font_min}
      defaultLanguage={profile.default_language}
      templates={(templates ?? []) as TemplateOption[]}
      initialDraft={draft}
      initialId={isCopy ? null : record.id}
      initialSerial={isCopy ? null : record.serial}
    />
  );
}
