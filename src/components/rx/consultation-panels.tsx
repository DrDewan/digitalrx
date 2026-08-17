"use client";

import { useMemo, useState } from "react";
import { useRxStore } from "@/lib/rx/store";
import { translate, VITAL_LABEL_KEYS } from "@/lib/i18n";
import { VITAL_KEYS, type Language } from "@/lib/rx/types";
import {
  ANATOMY_REGIONS,
  CHIEF_COMPLAINT_GROUPS,
  INVESTIGATION_GROUPS,
} from "@/lib/clinical/data";
import { Collapsible, Field, Panel, SearchInput } from "@/components/ui";
import { AnatomyFigure } from "@/components/rx/anatomy-figure";
import { IconX } from "@/components/icons";

type T = (key: Parameters<typeof translate>[1]) => string;

/* -------------------------------------------------------------------------- */
/* Chief complaint                                                             */
/* -------------------------------------------------------------------------- */

export function ComplaintsPanel({ language }: { language: Language }) {
  const t: T = (key) => translate(language, key);
  const selected = useRxStore((s) => s.draft.chiefComplaints.selected);
  const final = useRxStore((s) => s.draft.chiefComplaints.final);
  const toggle = useRxStore((s) => s.toggleComplaint);
  const apply = useRxStore((s) => s.applyComplaintsToFinal);
  const setFinal = useRxStore((s) => s.setFinalComplaints);

  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CHIEF_COMPLAINT_GROUPS;
    return CHIEF_COMPLAINT_GROUPS.map((g) => ({
      ...g,
      items: g.items.filter((i) => i.toLowerCase().includes(q)),
    })).filter((g) => g.items.length);
  }, [query]);

  return (
    <Panel
      title={t("chiefComplaint")}
      actions={
        <button
          type="button"
          className="btn-secondary btn-sm"
          onClick={apply}
          disabled={!selected.length}
        >
          {t("apply")}
        </button>
      }
    >
      <p className="hint">{t("complaintHint")}</p>

      <SearchInput value={query} onChange={setQuery} placeholder={t("search")} />

      <div className="scroll-list">
        {groups.map((group) => (
          <div key={group.group} className="mb-2 last:mb-0">
            <p className="px-2 pt-1.5 pb-1 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
              {group.group}
            </p>
            <div className="grid gap-0.5 sm:grid-cols-2">
              {group.items.map((item) => {
                const on = selected.includes(item);
                return (
                  <label key={item} className={`tick ${on ? "tick-on" : ""}`}>
                    <input type="checkbox" checked={on} onChange={() => toggle(item)} />
                    <span>{item}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
        {!groups.length && <p className="hint p-2">{t("none")}</p>}
      </div>

      <Field label={t("chiefComplaintFinal")} htmlFor="cc-final">
        <textarea
          id="cc-final"
          rows={3}
          value={final}
          onChange={(e) => setFinal(e.target.value)}
          className={language === "bn" ? "bn-text" : ""}
        />
      </Field>
    </Panel>
  );
}

/* -------------------------------------------------------------------------- */
/* History                                                                     */
/* -------------------------------------------------------------------------- */

export function HistoryPanel({ language }: { language: Language }) {
  const t: T = (key) => translate(language, key);
  const history = useRxStore((s) => s.draft.history);
  const setHistory = useRxStore((s) => s.setHistory);

  const filled = Object.values(history).filter((v) => v.trim()).length;

  const fields: Array<[keyof typeof history, Parameters<typeof translate>[1]]> = [
    ["comorbidities", "comorbidities"],
    ["pastMedical", "pastMedical"],
    ["treatment", "treatmentHistory"],
    ["drug", "drugHistory"],
  ];

  return (
    <Collapsible title={t("history")} count={filled} storageKey="history">
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map(([key, labelKey]) => (
          <Field key={key} label={t(labelKey)} htmlFor={`history-${key}`}>
            <textarea
              id={`history-${key}`}
              rows={2}
              value={history[key]}
              onChange={(e) => setHistory(key, e.target.value)}
            />
          </Field>
        ))}
      </div>
    </Collapsible>
  );
}

/* -------------------------------------------------------------------------- */
/* Examination                                                                 */
/* -------------------------------------------------------------------------- */

export function ExaminationPanel({ language }: { language: Language }) {
  const t: T = (key) => translate(language, key);
  const findings = useRxStore((s) => s.draft.examination.findings);
  const vitals = useRxStore((s) => s.draft.examination.vitals);
  const anatomy = useRxStore((s) => s.draft.examination.anatomy);
  const setFindings = useRxStore((s) => s.setFindings);
  const setVital = useRxStore((s) => s.setVital);
  const toggleAnatomy = useRxStore((s) => s.toggleAnatomy);

  return (
    <Panel title={t("examination")}>
      <Field label={t("findings")} htmlFor="findings">
        <textarea id="findings" rows={3} value={findings} onChange={(e) => setFindings(e.target.value)} />
      </Field>

      <div>
        <p className="field-label">{t("vitals")}</p>
        <p className="hint mb-2">{t("vitalsHint")}</p>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {VITAL_KEYS.map((key) => {
            const vital = vitals[key];
            return (
              <div
                key={key}
                className={`flex items-center gap-2 rounded-md border px-2 py-1.5 transition ${
                  vital.show ? "border-brand-200 bg-brand-50" : "border-slate-200 bg-white"
                }`}
              >
                <label className="flex flex-1 cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="size-4 shrink-0"
                    style={{ accentColor: "var(--color-brand-600)" }}
                    checked={vital.show}
                    onChange={(e) => setVital(key, { show: e.target.checked })}
                  />
                  <span className="truncate">{t(VITAL_LABEL_KEYS[key])}</span>
                </label>
                <input
                  type="text"
                  aria-label={t(VITAL_LABEL_KEYS[key])}
                  value={vital.value}
                  placeholder="—"
                  className="!w-24 !py-1 text-center"
                  onChange={(e) => setVital(key, { value: e.target.value, show: true })}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <p className="field-label">{t("anatomy")}</p>
        <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-4">
          {ANATOMY_REGIONS.map((region) => {
            const on = anatomy.includes(region.id);
            return (
              <button
                key={region.id}
                type="button"
                aria-pressed={on}
                onClick={() => toggleAnatomy(region.id)}
                className={`flex flex-col items-center gap-1 rounded-md border px-1 py-2 text-center transition ${
                  on
                    ? "border-brand-500 bg-brand-50"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <AnatomyFigure region={region.id} active={on} />
                <span className="text-[11px] leading-tight text-slate-600">
                  {language === "bn" ? region.labelBn : region.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}

/* -------------------------------------------------------------------------- */
/* Investigations                                                              */
/* -------------------------------------------------------------------------- */

export function InvestigationsPanel({ language }: { language: Language }) {
  const t: T = (key) => translate(language, key);
  const selected = useRxStore((s) => s.draft.investigations);
  const toggle = useRxStore((s) => s.toggleInvestigation);
  const clear = useRxStore((s) => s.clearInvestigations);

  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return INVESTIGATION_GROUPS;
    return INVESTIGATION_GROUPS.map((g) => ({
      ...g,
      items: g.items.filter((i) => i.toLowerCase().includes(q)),
    })).filter((g) => g.items.length);
  }, [query]);

  return (
    <Collapsible title={t("investigations")} count={selected.length} storageKey="investigations">
      <p className="hint">{t("investigationHint")}</p>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => toggle(item)}
              className="chip chip-active"
              title={t("remove")}
            >
              {item}
              <IconX className="size-3" />
            </button>
          ))}
          <button type="button" onClick={clear} className="btn-ghost btn-sm">
            {t("clear")}
          </button>
        </div>
      )}

      <SearchInput value={query} onChange={setQuery} placeholder={t("search")} />

      <div className="scroll-list">
        {groups.map((group) => {
          const chosen = group.items.filter((i) => selected.includes(i)).length;
          return (
            <div key={group.group} className="mb-2 last:mb-0">
              <p className="flex items-center gap-2 px-2 pt-1.5 pb-1 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                {group.group}
                {chosen > 0 && <span className="badge bg-brand-100 text-brand-800">{chosen}</span>}
              </p>
              <div className="grid gap-0.5 sm:grid-cols-2">
                {group.items.map((item) => {
                  const on = selected.includes(item);
                  return (
                    <label key={item} className={`tick ${on ? "tick-on" : ""}`}>
                      <input type="checkbox" checked={on} onChange={() => toggle(item)} />
                      <span>{item}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
        {!groups.length && <p className="hint p-2">{t("none")}</p>}
      </div>
    </Collapsible>
  );
}
