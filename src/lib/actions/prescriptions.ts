"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { draftSummary } from "@/lib/rx/compose";
import { migrateDraft, todayISO, type RxDraft } from "@/lib/rx/types";
import type { Json } from "@/lib/db/types";
import { upsertPatientFromDraft, type ActionResult } from "@/lib/actions/patients";

export type SavedPrescription = {
  id: string;
  serial: number;
  patientId: string | null;
};

/**
 * Saves the consultation. Creates or updates the linked patient record in the
 * same call so the doctor never has to think about it.
 *
 * `id` present → updates that prescription (used when reprinting after an edit).
 */
export async function savePrescription(
  rawDraft: RxDraft,
  options: { id?: string | null; markPrinted?: boolean } = {},
): Promise<ActionResult<SavedPrescription>> {
  const draft = migrateDraft(rawDraft);

  if (!draft.patient.name.trim()) {
    return { ok: false, error: "Enter a patient name before saving." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const patientResult = await upsertPatientFromDraft(draft.patient);
  if (!patientResult.ok) return patientResult;
  const patientId = patientResult.data.id;

  const linkedDraft: RxDraft = { ...draft, patient: { ...draft.patient, patientId } };

  const row = {
    user_id: user.id,
    patient_id: patientId,
    // An empty date input would reach Postgres as '' and fail the insert.
    visit_date: draft.visitDate || todayISO(),
    patient_snapshot: {
      name: draft.patient.name.trim(),
      age: draft.patient.age.trim(),
      sex: draft.patient.sex,
      mrn: draft.patient.mrn.trim(),
      weight: draft.patient.weight.trim(),
      phone: draft.patient.phone.trim(),
    } as unknown as Json,
    content: linkedDraft as unknown as Json,
    summary: draftSummary(draft),
    ...(options.markPrinted ? { printed_at: new Date().toISOString() } : {}),
  };

  const query = options.id
    ? supabase.from("prescriptions").update(row).eq("id", options.id).select("id, serial").single()
    : supabase.from("prescriptions").insert(row).select("id, serial").single();

  const { data, error } = await query;
  if (error) return { ok: false, error: error.message };

  await bumpMedicineUsage(draft);

  revalidatePath("/prescriptions");
  revalidatePath("/patients");
  if (patientId) revalidatePath(`/patients/${patientId}`);

  return { ok: true, data: { id: data.id, serial: data.serial, patientId } };
}

/** Keeps the doctor's own medicine list ordered by what they actually prescribe. */
async function bumpMedicineUsage(draft: RxDraft) {
  const names = Array.from(
    new Set(draft.medicines.map((m) => m.name.trim()).filter((n) => n.length > 1)),
  );
  if (!names.length) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: existing } = await supabase
    .from("medicines")
    .select("id, name, use_count")
    .eq("user_id", user.id)
    .in("name", names);

  const seen = new Map((existing ?? []).map((m) => [m.name.toLowerCase(), m] as const));

  for (const name of names) {
    const hit = seen.get(name.toLowerCase());
    if (hit) {
      await supabase
        .from("medicines")
        .update({ use_count: (hit.use_count ?? 0) + 1 })
        .eq("id", hit.id);
    }
  }
}

export async function markPrinted(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("prescriptions")
    .update({ printed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/prescriptions");
  return { ok: true, data: null };
}

export async function deletePrescription(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("prescriptions").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/prescriptions");
  return { ok: true, data: null };
}
