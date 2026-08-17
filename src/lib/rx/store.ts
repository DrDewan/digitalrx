"use client";

import { create } from "zustand";
import {
  DRAFT_VERSION,
  emptyDraft,
  migrateDraft,
  todayISO,
  type AdviceLine,
  type Language,
  type MedicineLine,
  type OverlaySectionKey,
  type PatientDraft,
  type RxDraft,
  type VitalKey,
} from "@/lib/rx/types";

const LOCAL_KEY = "digital-rx:draft:v1";

export type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

type RxState = {
  draft: RxDraft;
  /** Set once the consultation has been written to the database. */
  savedId: string | null;
  savedSerial: number | null;
  saveState: SaveState;
  lastError: string | null;

  /**
   * Replace the whole draft (loading a record, applying a template).
   * `persist: false` when opening a *saved* record — otherwise it would be
   * mirrored to localStorage and later offered back as an unsaved draft,
   * which is how duplicate prescriptions get created.
   */
  setDraft: (
    draft: RxDraft,
    meta?: {
      savedId?: string | null;
      savedSerial?: number | null;
      persist?: boolean;
      saveState?: SaveState;
    },
  ) => void;
  reset: (language?: Language) => void;
  patch: (partial: Partial<RxDraft>) => void;

  setLanguage: (language: Language) => void;
  setVisitDate: (date: string) => void;

  setPatient: (partial: Partial<PatientDraft>) => void;
  clearPatientLink: () => void;

  toggleComplaint: (item: string) => void;
  applyComplaintsToFinal: () => void;
  setFinalComplaints: (value: string) => void;

  setHistory: (field: keyof RxDraft["history"], value: string) => void;
  setFindings: (value: string) => void;
  setVital: (key: VitalKey, partial: Partial<{ show: boolean; value: string }>) => void;
  toggleAnatomy: (id: string) => void;

  toggleInvestigation: (item: string) => void;
  clearInvestigations: () => void;

  setDiagnosis: (value: string) => void;
  setPlan: (value: string) => void;
  setNotes: (value: string) => void;
  setFollowUp: (partial: Partial<RxDraft["followUp"]>) => void;

  addMedicine: (line?: Partial<MedicineLine>) => void;
  updateMedicine: (id: string, partial: Partial<MedicineLine>) => void;
  removeMedicine: (id: string) => void;
  moveMedicine: (id: string, direction: -1 | 1) => void;

  toggleAdvice: (item: AdviceLine) => void;
  addCustomAdvice: (text: string) => void;
  removeAdvice: (id: string) => void;

  setOverlayAuto: (section: OverlaySectionKey, auto: boolean) => void;
  setOverlayManual: (section: OverlaySectionKey, value: string) => void;

  setSaveState: (state: SaveState, error?: string | null) => void;
  markSaved: (id: string, serial: number) => void;

  loadLocal: () => boolean;
  clearLocal: () => void;
};

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `id-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}

export function blankMedicine(partial: Partial<MedicineLine> = {}): MedicineLine {
  return {
    id: newId(),
    name: "",
    strength: "",
    dose: "",
    frequency: "",
    duration: "",
    instructions: "",
    ...partial,
  };
}

function clearLocalStorage() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LOCAL_KEY);
  } catch {
    // ignore
  }
}

/** Persist the working draft so a refresh or a crash mid-consultation is survivable. */
function persistLocal(draft: RxDraft) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify({ v: DRAFT_VERSION, draft }));
  } catch {
    // Private mode or quota exceeded — the database remains the real store.
  }
}

export const useRxStore = create<RxState>()((set, get) => {
  /** Every mutation funnels through here so dirty-tracking and autosave are automatic. */
  const mutate = (updater: (draft: RxDraft) => RxDraft) => {
    set((state) => {
      const draft = updater(state.draft);
      persistLocal(draft);
      return { draft, saveState: "dirty" as SaveState };
    });
  };

  return {
    draft: emptyDraft(),
    savedId: null,
    savedSerial: null,
    saveState: "idle",
    lastError: null,

    setDraft: (draft, meta) =>
      set(() => {
        // `persist: false` means "don't mirror this one" — it must NOT wipe the
        // key, or opening an old record would destroy an in-progress draft.
        if (meta?.persist !== false) persistLocal(draft);
        return {
          draft,
          savedId: meta?.savedId ?? null,
          savedSerial: meta?.savedSerial ?? null,
          saveState: meta?.saveState ?? ("idle" as SaveState),
          lastError: null,
        };
      }),

    reset: (language) =>
      set((state) => {
        // Safe to read the clock here: reset only ever runs from a click.
        const draft = emptyDraft(language ?? state.draft.language, todayISO());
        persistLocal(draft);
        return { draft, savedId: null, savedSerial: null, saveState: "idle" as SaveState, lastError: null };
      }),

    patch: (partial) => mutate((d) => ({ ...d, ...partial })),

    setLanguage: (language) => mutate((d) => ({ ...d, language })),
    setVisitDate: (visitDate) => mutate((d) => ({ ...d, visitDate })),

    setPatient: (partial) => mutate((d) => ({ ...d, patient: { ...d.patient, ...partial } })),
    clearPatientLink: () => mutate((d) => ({ ...d, patient: { ...d.patient, patientId: null } })),

    toggleComplaint: (item) =>
      mutate((d) => {
        const selected = d.chiefComplaints.selected.includes(item)
          ? d.chiefComplaints.selected.filter((x) => x !== item)
          : [...d.chiefComplaints.selected, item];
        return { ...d, chiefComplaints: { ...d.chiefComplaints, selected } };
      }),

    applyComplaintsToFinal: () =>
      mutate((d) => {
        const picked = d.chiefComplaints.selected;
        if (!picked.length) return d;
        const existing = d.chiefComplaints.final.trim();
        const merged = existing
          ? Array.from(new Set([...existing.split(/\s*;\s*/), ...picked].filter(Boolean)))
          : picked;
        return { ...d, chiefComplaints: { ...d.chiefComplaints, final: merged.join("; ") } };
      }),

    setFinalComplaints: (final) =>
      mutate((d) => ({ ...d, chiefComplaints: { ...d.chiefComplaints, final } })),

    setHistory: (field, value) => mutate((d) => ({ ...d, history: { ...d.history, [field]: value } })),

    setFindings: (findings) =>
      mutate((d) => ({ ...d, examination: { ...d.examination, findings } })),

    setVital: (key, partial) =>
      mutate((d) => ({
        ...d,
        examination: {
          ...d.examination,
          vitals: { ...d.examination.vitals, [key]: { ...d.examination.vitals[key], ...partial } },
        },
      })),

    toggleAnatomy: (id) =>
      mutate((d) => {
        const anatomy = d.examination.anatomy.includes(id)
          ? d.examination.anatomy.filter((x) => x !== id)
          : [...d.examination.anatomy, id];
        return { ...d, examination: { ...d.examination, anatomy } };
      }),

    toggleInvestigation: (item) =>
      mutate((d) => {
        const investigations = d.investigations.includes(item)
          ? d.investigations.filter((x) => x !== item)
          : [...d.investigations, item];
        return { ...d, investigations };
      }),

    clearInvestigations: () => mutate((d) => ({ ...d, investigations: [] })),

    setDiagnosis: (diagnosis) => mutate((d) => ({ ...d, diagnosis })),
    setPlan: (plan) => mutate((d) => ({ ...d, plan })),
    setNotes: (notes) => mutate((d) => ({ ...d, notes })),
    setFollowUp: (partial) => mutate((d) => ({ ...d, followUp: { ...d.followUp, ...partial } })),

    addMedicine: (line) => mutate((d) => ({ ...d, medicines: [...d.medicines, blankMedicine(line)] })),

    updateMedicine: (id, partial) =>
      mutate((d) => ({
        ...d,
        medicines: d.medicines.map((m) => (m.id === id ? { ...m, ...partial } : m)),
      })),

    removeMedicine: (id) =>
      mutate((d) => ({ ...d, medicines: d.medicines.filter((m) => m.id !== id) })),

    moveMedicine: (id, direction) =>
      mutate((d) => {
        const index = d.medicines.findIndex((m) => m.id === id);
        const target = index + direction;
        if (index < 0 || target < 0 || target >= d.medicines.length) return d;
        const medicines = [...d.medicines];
        const [moved] = medicines.splice(index, 1);
        medicines.splice(target, 0, moved);
        return { ...d, medicines };
      }),

    toggleAdvice: (item) =>
      mutate((d) => {
        const exists = d.advice.some((a) => a.id === item.id);
        return {
          ...d,
          advice: exists ? d.advice.filter((a) => a.id !== item.id) : [...d.advice, item],
        };
      }),

    addCustomAdvice: (text) =>
      mutate((d) => {
        const value = text.trim();
        if (!value) return d;
        return { ...d, advice: [...d.advice, { id: `custom:${newId()}`, en: value, bn: value }] };
      }),

    removeAdvice: (id) => mutate((d) => ({ ...d, advice: d.advice.filter((a) => a.id !== id) })),

    setOverlayAuto: (section, auto) =>
      mutate((d) => ({ ...d, overlay: { ...d.overlay, auto: { ...d.overlay.auto, [section]: auto } } })),

    setOverlayManual: (section, value) =>
      mutate((d) => ({
        ...d,
        overlay: {
          ...d.overlay,
          auto: { ...d.overlay.auto, [section]: false },
          manual: { ...d.overlay.manual, [section]: value },
        },
      })),

    setSaveState: (saveState, lastError = null) => set({ saveState, lastError }),

    markSaved: (id, serial) =>
      set({ savedId: id, savedSerial: serial, saveState: "saved", lastError: null }),

    loadLocal: () => {
      if (typeof window === "undefined") return false;
      try {
        const raw = window.localStorage.getItem(LOCAL_KEY);
        if (!raw) return false;
        const parsed = JSON.parse(raw) as { draft?: unknown };
        const draft = migrateDraft(parsed?.draft, get().draft.language);
        const meaningful =
          draft.patient.name.trim() ||
          draft.chiefComplaints.final.trim() ||
          draft.medicines.length > 0 ||
          draft.diagnosis.trim();
        if (!meaningful) return false;
        // A restored draft is unsaved by definition: drop any record identity,
        // otherwise the next save would overwrite whatever was open before.
        set({ draft, saveState: "dirty", savedId: null, savedSerial: null });
        return true;
      } catch {
        return false;
      }
    },

    clearLocal: clearLocalStorage,
  };
});
