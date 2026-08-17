/**
 * The shape of a consultation. This is the single source of truth for the
 * workspace form, for what gets saved to `prescriptions.content`, and for what
 * a template stores. Everything is plain JSON so a saved prescription can be
 * reloaded and reprinted years later without a migration.
 *
 * Versioned: bump DRAFT_VERSION and extend `migrateDraft` when the shape changes.
 */

export const DRAFT_VERSION = 1;

export type Language = "en" | "bn";

export type Sex = "Male" | "Female" | "Other";

export const VITAL_KEYS = [
  "bp",
  "pulse",
  "temp",
  "spo2",
  "rr",
  "height",
  "weight",
] as const;

export type VitalKey = (typeof VITAL_KEYS)[number];

export type Vital = { show: boolean; value: string };

export type MedicineLine = {
  /** Stable id so React keys survive reordering. */
  id: string;
  name: string;
  strength: string;
  dose: string;
  frequency: string;
  duration: string;
  instructions: string;
};

export type AdviceLine = {
  /** Slug of a built-in advice line, or `custom:<uuid>` for a typed one. */
  id: string;
  en: string;
  bn: string;
};

export type PatientDraft = {
  /** Set once the consultation is linked to a saved patient record. */
  patientId: string | null;
  name: string;
  age: string;
  sex: Sex | "";
  mrn: string;
  weight: string;
  phone: string;
};

export const OVERLAY_SECTIONS = ["disease", "treatment", "diagnosis", "advice"] as const;

export type OverlaySectionKey = (typeof OVERLAY_SECTIONS)[number];

/**
 * Each of the four printed blocks is composed from the consultation by default.
 * Typing into a block switches it to manual and stops it tracking the form,
 * which is reversible — the manual text is kept even while Auto is back on.
 */
export type OverlayDraft = {
  auto: Record<OverlaySectionKey, boolean>;
  manual: Record<OverlaySectionKey, string>;
};

export type RxDraft = {
  version: number;
  language: Language;
  visitDate: string; // YYYY-MM-DD
  patient: PatientDraft;
  chiefComplaints: {
    selected: string[];
    final: string;
  };
  history: {
    comorbidities: string;
    pastMedical: string;
    treatment: string;
    drug: string;
  };
  examination: {
    findings: string;
    vitals: Record<VitalKey, Vital>;
    anatomy: string[];
  };
  investigations: string[];
  diagnosis: string;
  medicines: MedicineLine[];
  advice: AdviceLine[];
  plan: string;
  notes: string;
  followUp: { date: string; note: string };
  overlay: OverlayDraft;
};

export type OverlayBox = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export type OverlayBoxes = {
  disease: OverlayBox;
  treatment: OverlayBox;
  diagnosis: OverlayBox;
  advice: OverlayBox;
};

export const DEFAULT_OVERLAY_BOXES: OverlayBoxes = {
  disease: { top: 85, left: 15, width: 80, height: 110 },
  treatment: { top: 85, left: 110, width: 85, height: 110 },
  diagnosis: { top: 195, left: 15, width: 180, height: 25 },
  advice: { top: 220, left: 15, width: 180, height: 40 },
};

export function emptyVitals(): Record<VitalKey, Vital> {
  return VITAL_KEYS.reduce(
    (acc, key) => {
      acc[key] = { show: false, value: "" };
      return acc;
    },
    {} as Record<VitalKey, Vital>,
  );
}

export function todayISO(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * `visitDate` defaults to empty rather than today on purpose: this runs during
 * server rendering too, and the server's date is not the doctor's date. The
 * workspace fills it in on mount, in the browser's timezone.
 */
export function emptyDraft(language: Language = "en", visitDate = ""): RxDraft {
  return {
    version: DRAFT_VERSION,
    language,
    visitDate,
    patient: { patientId: null, name: "", age: "", sex: "", mrn: "", weight: "", phone: "" },
    chiefComplaints: { selected: [], final: "" },
    history: { comorbidities: "", pastMedical: "", treatment: "", drug: "" },
    examination: { findings: "", vitals: emptyVitals(), anatomy: [] },
    investigations: [],
    diagnosis: "",
    medicines: [],
    advice: [],
    plan: "",
    notes: "",
    followUp: { date: "", note: "" },
    overlay: {
      auto: { disease: true, treatment: true, diagnosis: true, advice: true },
      manual: { disease: "", treatment: "", diagnosis: "", advice: "" },
    },
  };
}

/**
 * Accepts anything previously persisted and returns a draft that satisfies the
 * current type, filling in fields added since. Never throws.
 */
export function migrateDraft(input: unknown, language: Language = "en"): RxDraft {
  const base = emptyDraft(language);
  if (!input || typeof input !== "object") return base;
  const raw = input as Partial<RxDraft> & Record<string, unknown>;

  const vitals = emptyVitals();
  const rawVitals = (raw.examination as RxDraft["examination"] | undefined)?.vitals;
  if (rawVitals && typeof rawVitals === "object") {
    for (const key of VITAL_KEYS) {
      const v = (rawVitals as Record<string, unknown>)[key];
      if (v && typeof v === "object") {
        vitals[key] = {
          show: Boolean((v as Vital).show),
          value: String((v as Vital).value ?? ""),
        };
      }
    }
  }

  return {
    ...base,
    ...raw,
    version: DRAFT_VERSION,
    language: raw.language === "bn" ? "bn" : "en",
    visitDate: typeof raw.visitDate === "string" && raw.visitDate ? raw.visitDate : base.visitDate,
    patient: { ...base.patient, ...(raw.patient ?? {}) },
    chiefComplaints: { ...base.chiefComplaints, ...(raw.chiefComplaints ?? {}) },
    history: { ...base.history, ...(raw.history ?? {}) },
    examination: {
      ...base.examination,
      ...(raw.examination ?? {}),
      vitals,
      anatomy: Array.isArray(raw.examination?.anatomy) ? raw.examination.anatomy : [],
    },
    investigations: Array.isArray(raw.investigations) ? raw.investigations : [],
    medicines: Array.isArray(raw.medicines) ? raw.medicines : [],
    advice: Array.isArray(raw.advice) ? raw.advice : [],
    followUp: { ...base.followUp, ...(raw.followUp ?? {}) },
    overlay: {
      auto: { ...base.overlay.auto, ...(raw.overlay?.auto ?? {}) },
      manual: { ...base.overlay.manual, ...(raw.overlay?.manual ?? {}) },
    },
  };
}
