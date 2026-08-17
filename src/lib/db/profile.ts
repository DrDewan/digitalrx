import { createClient } from "@/lib/supabase/server";
import { DEFAULT_OVERLAY_BOXES, type OverlayBox, type OverlayBoxes } from "@/lib/rx/types";
import type { ProfileRow } from "@/lib/db/types";

export type Profile = Omit<ProfileRow, "overlay_boxes"> & { overlay_boxes: OverlayBoxes };

function num(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function box(value: unknown, fallback: OverlayBox): OverlayBox {
  if (!value || typeof value !== "object") return fallback;
  const v = value as Record<string, unknown>;
  return {
    top: num(v.top, fallback.top),
    left: num(v.left, fallback.left),
    width: num(v.width, fallback.width),
    height: num(v.height, fallback.height),
  };
}

/** Tolerates a partial or absent JSON blob and always returns a usable geometry. */
export function parseOverlayBoxes(value: unknown): OverlayBoxes {
  const v = (value ?? {}) as Record<string, unknown>;
  return {
    disease: box(v.disease, DEFAULT_OVERLAY_BOXES.disease),
    treatment: box(v.treatment, DEFAULT_OVERLAY_BOXES.treatment),
    diagnosis: box(v.diagnosis, DEFAULT_OVERLAY_BOXES.diagnosis),
    advice: box(v.advice, DEFAULT_OVERLAY_BOXES.advice),
  };
}

export function emptyProfile(id: string): Profile {
  const now = new Date().toISOString();
  return {
    id,
    doctor_name: "",
    qualifications: "",
    bmdc_no: "",
    clinic_name: "",
    clinic_address: "",
    clinic_phone: "",
    clinic_email: "",
    default_language: "en",
    overlay_boxes: DEFAULT_OVERLAY_BOXES,
    overlay_font_max: 11,
    overlay_font_min: 9,
    rx_counter: 0,
    created_at: now,
    updated_at: now,
  };
}

/**
 * The profile row is created by a database trigger at signup. If it is missing
 * for any reason we fall back to defaults rather than failing the page.
 */
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!data) return emptyProfile(user.id);

  return { ...data, overlay_boxes: parseOverlayBoxes(data.overlay_boxes) };
}
