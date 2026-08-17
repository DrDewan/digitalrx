"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_OVERLAY_BOXES, type OverlayBoxes } from "@/lib/rx/types";
import type { Json, ProfileRow } from "@/lib/db/types";
import type { ActionResult } from "@/lib/actions/patients";

/** Reads a box value from the form, falling back to the shipped default. */
function boxFrom(form: FormData, key: keyof OverlayBoxes): OverlayBoxes[keyof OverlayBoxes] {
  const num = (field: string, fallback: number) => {
    const raw = Number(form.get(`${key}_${field}`));
    return Number.isFinite(raw) && raw >= 0 && raw <= 400 ? raw : fallback;
  };
  const d = DEFAULT_OVERLAY_BOXES[key];
  return {
    top: num("top", d.top),
    left: num("left", d.left),
    width: num("width", d.width),
    height: num("height", d.height),
  };
}

export async function updateProfile(form: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const language = String(form.get("default_language") ?? "en");
  const fontMax = Number(form.get("overlay_font_max"));
  const fontMin = Number(form.get("overlay_font_min"));

  const overlay_boxes: OverlayBoxes = {
    disease: boxFrom(form, "disease"),
    treatment: boxFrom(form, "treatment"),
    diagnosis: boxFrom(form, "diagnosis"),
    advice: boxFrom(form, "advice"),
  };

  const payload: Partial<ProfileRow> & { id: string } = {
    id: user.id,
    doctor_name: String(form.get("doctor_name") ?? "").trim(),
    qualifications: String(form.get("qualifications") ?? "").trim(),
    bmdc_no: String(form.get("bmdc_no") ?? "").trim(),
    clinic_name: String(form.get("clinic_name") ?? "").trim(),
    clinic_address: String(form.get("clinic_address") ?? "").trim(),
    clinic_phone: String(form.get("clinic_phone") ?? "").trim(),
    clinic_email: String(form.get("clinic_email") ?? "").trim(),
    default_language: language === "bn" ? "bn" : "en",
    overlay_boxes: overlay_boxes as unknown as Json,
    overlay_font_max: Number.isFinite(fontMax) ? Math.min(24, Math.max(6, fontMax)) : 11,
    overlay_font_min: Number.isFinite(fontMin) ? Math.min(24, Math.max(6, fontMin)) : 9,
  };

  if (payload.overlay_font_min! > payload.overlay_font_max!) {
    payload.overlay_font_min = payload.overlay_font_max;
  }

  const { error } = await supabase.from("profiles").upsert(payload);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/", "layout");
  return { ok: true, data: null };
}
