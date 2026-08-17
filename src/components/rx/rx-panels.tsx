"use client";

import { useMemo, useState } from "react";
import { useRxStore } from "@/lib/rx/store";
import { translate } from "@/lib/i18n";
import { OVERLAY_SECTIONS, type Language, type OverlaySectionKey } from "@/lib/rx/types";
import { ADVICE_LIBRARY } from "@/lib/clinical/data";
import { overlayText } from "@/lib/rx/compose";
import { Collapsible, Field, Panel, SearchInput } from "@/components/ui";
import { IconPlus, IconX } from "@/components/icons";

type T = (key: Parameters<typeof translate>[1]) => string;

/* -------------------------------------------------------------------------- */
/* Diagnosis, plan, notes, follow-up                                           */
/* -------------------------------------------------------------------------- */

export function DiagnosisPanel({ language }: { language: Language }) {
  const t: T = (key) => translate(language, key);
  const diagnosis = useRxStore((s) => s.draft.diagnosis);
  const setDiagnosis = useRxStore((s) => s.setDiagnosis);

  return (
    <Panel title={t("diagnosis")}>
      <Field label={t("diagnosisImpression")} htmlFor="diagnosis">
        <textarea
          id="diagnosis"
          rows={3}
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
        />
      </Field>
    </Panel>
  );
}

export function PlanNotesPanel({ language }: { language: Language }) {
  const t: T = (key) => translate(language, key);
  const plan = useRxStore((s) => s.draft.plan);
  const notes = useRxStore((s) => s.draft.notes);
  const followUp = useRxStore((s) => s.draft.followUp);
  const setPlan = useRxStore((s) => s.setPlan);
  const setNotes = useRxStore((s) => s.setNotes);
  const setFollowUp = useRxStore((s) => s.setFollowUp);

  const filled = [plan, notes, followUp.date, followUp.note].filter((v) => v.trim()).length;

  return (
    <Collapsible title={`${t("plan")} · ${t("followUp")}`} count={filled} storageKey="plan">
      <Field label={t("plan")} htmlFor="plan">
        <textarea id="plan" rows={3} value={plan} onChange={(e) => setPlan(e.target.value)} />
      </Field>

      <Field label={t("notes")} htmlFor="notes">
        <textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={`${t("followUp")} — ${t("date")}`} htmlFor="follow-date">
          <input
            id="follow-date"
            type="date"
            value={followUp.date}
            onChange={(e) => setFollowUp({ date: e.target.value })}
          />
        </Field>
        <Field label={t("followUpNote")} htmlFor="follow-note">
          <input
            id="follow-note"
            type="text"
            value={followUp.note}
            onChange={(e) => setFollowUp({ note: e.target.value })}
          />
        </Field>
      </div>
    </Collapsible>
  );
}

/* -------------------------------------------------------------------------- */
/* Advice                                                                      */
/* -------------------------------------------------------------------------- */

export function AdvicePanel({ language }: { language: Language }) {
  const t: T = (key) => translate(language, key);
  const advice = useRxStore((s) => s.draft.advice);
  const toggleAdvice = useRxStore((s) => s.toggleAdvice);
  const addCustomAdvice = useRxStore((s) => s.addCustomAdvice);
  const removeAdvice = useRxStore((s) => s.removeAdvice);

  const [query, setQuery] = useState("");
  const [custom, setCustom] = useState("");

  const chosenIds = useMemo(() => new Set(advice.map((a) => a.id)), [advice]);
  const customLines = advice.filter((a) => a.id.startsWith("custom:"));

  const library = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ADVICE_LIBRARY;
    return ADVICE_LIBRARY.filter(
      (a) => a.en.toLowerCase().includes(q) || a.bn.includes(query.trim()),
    );
  }, [query]);

  return (
    <Panel title={t("advice")}>
      <p className="hint">{t("adviceHint")}</p>

      <SearchInput value={query} onChange={setQuery} placeholder={t("search")} />

      <div className="scroll-list">
        {library.map((item) => {
          const on = chosenIds.has(item.id);
          const text = language === "bn" ? item.bn : item.en;
          return (
            <label key={item.id} className={`tick ${on ? "tick-on" : ""}`}>
              <input type="checkbox" checked={on} onChange={() => toggleAdvice(item)} />
              <span className={`whitespace-pre-line ${language === "bn" ? "bn-text" : ""}`}>{text}</span>
            </label>
          );
        })}
        {!library.length && <p className="hint p-2">{t("none")}</p>}
      </div>

      {customLines.length > 0 && (
        <ul className="space-y-1">
          {customLines.map((line) => (
            <li
              key={line.id}
              className="flex items-start justify-between gap-2 rounded-md border border-brand-200 bg-brand-50 px-2 py-1.5 text-sm"
            >
              <span className="whitespace-pre-line">{line.en}</span>
              <button
                type="button"
                aria-label={t("remove")}
                className="shrink-0 rounded p-0.5 text-slate-500 hover:bg-white hover:text-rose-600"
                onClick={() => removeAdvice(line.id)}
              >
                <IconX className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={custom}
          placeholder={`${t("advice")}…`}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustomAdvice(custom);
              setCustom("");
            }
          }}
        />
        <button
          type="button"
          className="btn-secondary shrink-0"
          onClick={() => {
            addCustomAdvice(custom);
            setCustom("");
          }}
        >
          <IconPlus />
          {t("add")}
        </button>
      </div>
    </Panel>
  );
}

/* -------------------------------------------------------------------------- */
/* Hospital pad blocks                                                         */
/* -------------------------------------------------------------------------- */

const SECTION_LABELS: Record<OverlaySectionKey, string> = {
  disease: "Disease description (left column)",
  treatment: "Treatment (right column)",
  diagnosis: "Clinical diagnosis",
  advice: "Advice",
};

export function OverlayPanel({ language }: { language: Language }) {
  const t: T = (key) => translate(language, key);
  const draft = useRxStore((s) => s.draft);
  const setOverlayAuto = useRxStore((s) => s.setOverlayAuto);
  const setOverlayManual = useRxStore((s) => s.setOverlayManual);

  return (
    <Collapsible title={t("hospitalOverlay")} storageKey="overlay" defaultOpen>
      <p className="hint">{t("overlayHint")}</p>

      {OVERLAY_SECTIONS.map((section) => {
        const auto = draft.overlay.auto[section];
        const value = overlayText(draft, section);
        const hasManual = Boolean(draft.overlay.manual[section]?.trim());
        return (
          <div key={section}>
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="field-label mb-0">{SECTION_LABELS[section]}</span>
              <div className="flex items-center gap-1.5">
                <span
                  className={`badge ${
                    auto ? "bg-slate-100 text-slate-600" : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {auto ? t("autoCompose") : t("overwritten")}
                </span>
                {auto ? (
                  // Switching to Auto keeps the hand-written version, so it is
                  // always recoverable rather than lost to a stray click.
                  hasManual && (
                    <button
                      type="button"
                      className="btn-ghost btn-sm"
                      onClick={() => setOverlayAuto(section, false)}
                    >
                      {t("restoreMine")}
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    className="btn-ghost btn-sm"
                    onClick={() => setOverlayAuto(section, true)}
                  >
                    {t("autoCompose")}
                  </button>
                )}
              </div>
            </div>
            <textarea
              rows={section === "disease" || section === "treatment" ? 6 : 3}
              value={value}
              aria-label={SECTION_LABELS[section]}
              className={`font-mono text-[13px] ${auto ? "bg-slate-50 text-slate-700" : ""}`}
              onChange={(e) => setOverlayManual(section, e.target.value)}
            />
          </div>
        );
      })}
    </Collapsible>
  );
}
