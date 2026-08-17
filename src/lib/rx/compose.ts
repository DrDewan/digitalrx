import { translate, VITAL_LABEL_KEYS } from "@/lib/i18n";
import { ANATOMY_REGIONS } from "@/lib/clinical/data";
import {
  VITAL_KEYS,
  type MedicineLine,
  type OverlaySectionKey,
  type RxDraft,
} from "@/lib/rx/types";

/**
 * Turns a consultation into the four blocks of text that land on the
 * pre-printed hospital pad. Pure string work — no DOM, fully unit-testable.
 */

export function formatMedicineLine(m: MedicineLine): string {
  const head = [m.name, m.strength].filter(Boolean).join(" ").trim();
  const tail = [m.dose, m.frequency, m.instructions, m.duration].filter(Boolean).join(", ");
  if (!head) return tail;
  return tail ? `${head} — ${tail}` : head;
}

export function vitalsSummary(draft: RxDraft): string[] {
  const out: string[] = [];
  for (const key of VITAL_KEYS) {
    const v = draft.examination.vitals[key];
    if (v?.show && v.value.trim()) {
      out.push(`${translate(draft.language, VITAL_LABEL_KEYS[key])}: ${v.value.trim()}`);
    }
  }
  return out;
}

export function anatomyLabels(draft: RxDraft): string[] {
  return draft.examination.anatomy
    .map((id) => {
      const region = ANATOMY_REGIONS.find((r) => r.id === id);
      if (!region) return id;
      return draft.language === "bn" ? region.labelBn : region.label;
    })
    .filter(Boolean);
}

/** Left column of the pad: complaint, history, comorbidities, examination, vitals. */
export function composeDisease(draft: RxDraft): string {
  const t = (k: Parameters<typeof translate>[1]) => translate(draft.language, k);
  const blocks: string[] = [];

  const cc = draft.chiefComplaints.final.trim();
  if (cc) blocks.push(cc);

  const historyBits = [
    draft.history.pastMedical.trim(),
    draft.history.treatment.trim(),
    draft.history.drug.trim(),
  ].filter(Boolean);
  if (historyBits.length) blocks.push(`${t("labelHistory")}\n${historyBits.join("\n")}`);

  const com = draft.history.comorbidities.trim();
  if (com) blocks.push(`${t("labelComorbidities")}\n${com}`);

  const findings = draft.examination.findings.trim();
  const regions = anatomyLabels(draft);
  const examBits = [findings, regions.length ? regions.join(", ") : ""].filter(Boolean);
  if (examBits.length) blocks.push(`${t("labelExamination")}\n${examBits.join("\n")}`);

  const vitals = vitalsSummary(draft);
  if (vitals.length) blocks.push(`${t("labelVitals")} ${vitals.join(" · ")}`);

  return blocks.join("\n\n").trim();
}

/** Right column of the pad: the drugs, then the tests requested. */
export function composeTreatment(draft: RxDraft): string {
  const t = (k: Parameters<typeof translate>[1]) => translate(draft.language, k);
  const blocks: string[] = [];

  const meds = draft.medicines.map(formatMedicineLine).filter((line) => line.trim().length > 0);
  if (meds.length) blocks.push(meds.map((line, i) => `${i + 1}. ${line}`).join("\n"));

  if (draft.investigations.length) {
    blocks.push(`${t("labelInvestigations")}\n${draft.investigations.join("\n")}`);
  }

  const plan = draft.plan.trim();
  if (plan) blocks.push(`${t("labelPlan")}\n${plan}`);

  return blocks.join("\n\n").trim();
}

/** Full-width diagnosis strip. */
export function composeDiagnosis(draft: RxDraft): string {
  return draft.diagnosis.trim();
}

/** Full-width advice strip: chosen advice lines, notes, then the follow-up date. */
export function composeAdvice(draft: RxDraft): string {
  const t = (k: Parameters<typeof translate>[1]) => translate(draft.language, k);
  const lines: string[] = [];

  for (const item of draft.advice) {
    const text = draft.language === "bn" && item.bn.trim() ? item.bn : item.en;
    if (text.trim()) lines.push(text.trim());
  }

  const notes = draft.notes.trim();
  if (notes) lines.push(notes);

  const followParts = [
    draft.followUp.date ? formatDisplayDate(draft.followUp.date) : "",
    draft.followUp.note.trim(),
  ].filter(Boolean);
  if (followParts.length) lines.push(`${t("labelFollowUp")} ${followParts.join(" — ")}`);

  return lines.join("\n").trim();
}

export function formatDisplayDate(iso: string): string {
  if (!iso) return "";
  const parts = iso.split("-");
  if (parts.length !== 3) return iso;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

const COMPOSERS: Record<OverlaySectionKey, (d: RxDraft) => string> = {
  disease: composeDisease,
  treatment: composeTreatment,
  diagnosis: composeDiagnosis,
  advice: composeAdvice,
};

/** The text that will actually print for one block, honouring the Auto toggle. */
export function overlayText(draft: RxDraft, section: OverlaySectionKey): string {
  if (draft.overlay.auto[section]) return COMPOSERS[section](draft);
  return draft.overlay.manual[section] ?? "";
}

export function overlayTexts(draft: RxDraft): Record<OverlaySectionKey, string> {
  return {
    disease: overlayText(draft, "disease"),
    treatment: overlayText(draft, "treatment"),
    diagnosis: overlayText(draft, "diagnosis"),
    advice: overlayText(draft, "advice"),
  };
}

/** One-line description used in list views. */
export function draftSummary(draft: RxDraft): string {
  const dx = draft.diagnosis.trim().split("\n")[0];
  if (dx) return dx.slice(0, 160);
  const cc = draft.chiefComplaints.final.trim().split("\n")[0];
  if (cc) return cc.slice(0, 160);
  const first = draft.medicines.find((m) => m.name.trim());
  return first ? formatMedicineLine(first).slice(0, 160) : "";
}
