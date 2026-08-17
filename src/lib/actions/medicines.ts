"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/actions/patients";

export type MedicineInput = {
  name: string;
  generic?: string;
  strength?: string;
  form?: string;
  category?: string;
  default_dose?: string;
  default_frequency?: string;
  default_duration?: string;
  default_instructions?: string;
};

/** Adds a drug to the doctor's own list, with whatever defaults they set. */
export async function createMedicine(input: MedicineInput): Promise<ActionResult<{ id: string }>> {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Enter a medicine name." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data, error } = await supabase
    .from("medicines")
    .insert({
      user_id: user.id,
      name,
      generic: input.generic?.trim() ?? "",
      strength: input.strength?.trim() ?? "",
      form: input.form?.trim() ?? "",
      category: input.category?.trim() || "Custom",
      default_dose: input.default_dose?.trim() ?? "",
      default_frequency: input.default_frequency?.trim() ?? "",
      default_duration: input.default_duration?.trim() ?? "",
      default_instructions: input.default_instructions?.trim() ?? "",
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings/medicines");
  return { ok: true, data: { id: data.id } };
}

export async function deleteMedicine(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("medicines").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings/medicines");
  return { ok: true, data: null };
}
