"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { emptyDraft, migrateDraft, type RxDraft } from "@/lib/rx/types";
import type { Json } from "@/lib/db/types";
import type { ActionResult } from "@/lib/actions/patients";

/**
 * A template is a consultation with the patient stripped out — so applying one
 * can never carry another patient's identity into the current prescription.
 *
 * Not exported: a "use server" module may only export async functions.
 */
function stripPatient(draft: RxDraft): RxDraft {
  const blank = emptyDraft(draft.language);
  return { ...draft, patient: blank.patient, visitDate: blank.visitDate, followUp: draft.followUp };
}

export async function saveTemplate(
  name: string,
  description: string,
  rawDraft: RxDraft,
): Promise<ActionResult<{ id: string }>> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Give the template a name." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const content = stripPatient(migrateDraft(rawDraft)) as unknown as Json;

  const { data, error } = await supabase
    .from("templates")
    .upsert(
      { user_id: user.id, name: trimmed, description: description.trim(), content },
      { onConflict: "user_id,name" },
    )
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  revalidatePath("/templates");
  return { ok: true, data: { id: data.id } };
}

export async function deleteTemplate(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("templates").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/templates");
  return { ok: true, data: null };
}

export async function recordTemplateUse(id: string): Promise<void> {
  const supabase = await createClient();
  const { data } = await supabase.from("templates").select("use_count").eq("id", id).single();
  if (!data) return;
  await supabase
    .from("templates")
    .update({ use_count: (data.use_count ?? 0) + 1 })
    .eq("id", id);
}
