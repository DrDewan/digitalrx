"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { PatientRow } from "@/lib/db/types";
import type { PatientDraft } from "@/lib/rx/types";

export type ActionResult<T = null> = { ok: true; data: T } | { ok: false; error: string };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  return { supabase, user };
}

function sexOrNull(sex: string): PatientRow["sex"] {
  return sex === "Male" || sex === "Female" || sex === "Other" ? sex : null;
}

/**
 * Creates or updates the patient record behind a consultation and returns its id.
 * Called on save, so the doctor never has to visit a separate screen.
 *
 * Two rules matter here:
 *   - Only non-empty fields are written. Reopening a prescription from January
 *     and saving it must not blank out a phone number added in February.
 *   - An MRN typed by hand links to the existing record rather than inserting a
 *     duplicate (which the unique index would reject anyway).
 */
export async function upsertPatientFromDraft(
  patient: PatientDraft,
): Promise<ActionResult<{ id: string }>> {
  const name = patient.name.trim();
  if (!name) return { ok: false, error: "A patient name is required." };

  try {
    const { supabase, user } = await requireUser();

    const sex = sexOrNull(patient.sex);
    const optional = {
      age: patient.age.trim(),
      phone: patient.phone.trim(),
      mrn: patient.mrn.trim(),
      weight: patient.weight.trim(),
    };
    const changes: Partial<PatientRow> = { name };
    if (optional.age) changes.age = optional.age;
    if (optional.phone) changes.phone = optional.phone;
    if (optional.mrn) changes.mrn = optional.mrn;
    if (optional.weight) changes.weight = optional.weight;
    if (sex) changes.sex = sex;

    let targetId = patient.patientId;

    // Not linked, but an MRN was typed: adopt the existing record rather than
    // inserting a second row for the same person. `_` and `%` are LIKE
    // wildcards and must be escaped, or an MRN like "H_1042" would match
    // several rows and the lookup would quietly fail.
    if (!targetId && optional.mrn) {
      const pattern = optional.mrn.replace(/[\\%_]/g, "\\$&");
      const { data: existing } = await supabase
        .from("patients")
        .select("id")
        .eq("user_id", user.id)
        .ilike("mrn", pattern)
        .limit(1)
        .maybeSingle();
      if (existing) targetId = existing.id;
    }

    if (targetId) {
      const { data, error } = await supabase
        .from("patients")
        .update(changes)
        .eq("id", targetId)
        .select("id")
        .single();
      if (error) return { ok: false, error: error.message };
      revalidatePath("/patients");
      return { ok: true, data: { id: data.id } };
    }

    const { data, error } = await supabase
      .from("patients")
      .insert({ user_id: user.id, name, ...changes })
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };
    revalidatePath("/patients");
    return { ok: true, data: { id: data.id } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not save the patient." };
  }
}

export async function updatePatient(id: string, form: FormData): Promise<ActionResult> {
  try {
    const { supabase } = await requireUser();
    const { error } = await supabase
      .from("patients")
      .update({
        name: String(form.get("name") ?? "").trim(),
        age: String(form.get("age") ?? "").trim(),
        sex: sexOrNull(String(form.get("sex") ?? "")),
        phone: String(form.get("phone") ?? "").trim(),
        mrn: String(form.get("mrn") ?? "").trim(),
        weight: String(form.get("weight") ?? "").trim(),
        address: String(form.get("address") ?? "").trim(),
        notes: String(form.get("notes") ?? "").trim(),
      })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/patients/${id}`);
    revalidatePath("/patients");
    return { ok: true, data: null };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not update the patient." };
  }
}

export async function deletePatient(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireUser();
    const { error } = await supabase.from("patients").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/patients");
    return { ok: true, data: null };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not delete the patient." };
  }
}
