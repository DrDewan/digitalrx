"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRxStore } from "@/lib/rx/store";
import { translate } from "@/lib/i18n";
import type { Language } from "@/lib/rx/types";
import type { PatientRow } from "@/lib/db/types";
import { Modal, SearchInput } from "@/components/ui";
import { IconSearch, IconX } from "@/components/icons";

export function PatientBar({ language }: { language: Language }) {
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const patient = useRxStore((s) => s.draft.patient);
  const visitDate = useRxStore((s) => s.draft.visitDate);
  const setPatient = useRxStore((s) => s.setPatient);
  const setVisitDate = useRxStore((s) => s.setVisitDate);
  const clearPatientLink = useRxStore((s) => s.clearPatientLink);

  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <div className="no-print sticky top-14 z-10 border-b border-slate-200 bg-white/95 px-3 py-2.5 backdrop-blur lg:top-14">
        <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
          <div className="min-w-[13rem] flex-1">
            <label className="field-label" htmlFor="patient-name">
              {t("name")}
            </label>
            <input
              id="patient-name"
              type="text"
              value={patient.name}
              autoComplete="off"
              onChange={(e) => setPatient({ name: e.target.value })}
            />
          </div>

          <div className="w-20">
            <label className="field-label" htmlFor="patient-age">
              {t("age")}
            </label>
            <input
              id="patient-age"
              type="text"
              value={patient.age}
              onChange={(e) => setPatient({ age: e.target.value })}
            />
          </div>

          <div className="w-28">
            <label className="field-label" htmlFor="patient-sex">
              {t("sex")}
            </label>
            <select
              id="patient-sex"
              value={patient.sex}
              onChange={(e) => setPatient({ sex: e.target.value as typeof patient.sex })}
            >
              <option value="">—</option>
              <option value="Male">{t("male")}</option>
              <option value="Female">{t("female")}</option>
              <option value="Other">{t("other")}</option>
            </select>
          </div>

          <div className="w-28">
            <label className="field-label" htmlFor="patient-weight">
              {t("weight")}
            </label>
            <input
              id="patient-weight"
              type="text"
              placeholder="kg"
              value={patient.weight}
              onChange={(e) => setPatient({ weight: e.target.value })}
            />
          </div>

          <div className="w-32">
            <label className="field-label" htmlFor="patient-phone">
              {t("phone")}
            </label>
            <input
              id="patient-phone"
              type="tel"
              value={patient.phone}
              onChange={(e) => setPatient({ phone: e.target.value })}
            />
          </div>

          <div className="w-32">
            <label className="field-label" htmlFor="patient-mrn">
              {t("mrn")}
            </label>
            <input
              id="patient-mrn"
              type="text"
              value={patient.mrn}
              onChange={(e) => setPatient({ mrn: e.target.value })}
            />
          </div>

          <div className="w-40">
            <label className="field-label" htmlFor="visit-date">
              {t("date")}
            </label>
            <input
              id="visit-date"
              type="date"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
            />
          </div>

          <button type="button" className="btn-secondary" onClick={() => setSearchOpen(true)}>
            <IconSearch />
            {t("findPatient")}
          </button>
        </div>

        {patient.patientId && (
          <p className="mt-1.5 flex items-center gap-2 text-xs text-brand-800">
            <span className="badge bg-brand-100 text-brand-800">{t("linkedPatient")}</span>
            <button
              type="button"
              onClick={clearPatientLink}
              className="inline-flex items-center gap-1 text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline"
            >
              <IconX className="size-3" />
              {t("unlink")}
            </button>
          </p>
        )}
      </div>

      <PatientSearchDialog
        open={searchOpen}
        language={language}
        onClose={() => setSearchOpen(false)}
        onPick={(row) => {
          setPatient({
            patientId: row.id,
            name: row.name,
            age: row.age,
            sex: (row.sex ?? "") as typeof patient.sex,
            phone: row.phone,
            mrn: row.mrn,
            weight: row.weight,
          });
          setSearchOpen(false);
        }}
      />
    </>
  );
}

function PatientSearchDialog({
  open,
  onClose,
  onPick,
  language,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (row: PatientRow) => void;
  language: Language;
}) {
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(false);

  const run = useCallback(async (q: string) => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.rpc("search_patients", { q, lim: 25 });
    setRows((data as PatientRow[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handle = window.setTimeout(() => void run(query), 200);
    return () => window.clearTimeout(handle);
  }, [open, query, run]);

  return (
    <Modal open={open} onClose={onClose} title={t("findPatient")} width="max-w-xl">
      <SearchInput
        value={query}
        onChange={setQuery}
        autoFocus
        placeholder="Name, phone or MRN…"
        className="mb-3"
      />

      {loading && <p className="hint">{t("loading")}</p>}

      {!loading && rows.length === 0 && <p className="hint">{t("noPatients")}</p>}

      <ul className="divide-y divide-slate-100">
        {rows.map((row) => (
          <li key={row.id}>
            <button
              type="button"
              onClick={() => onPick(row)}
              className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-2.5 text-left hover:bg-slate-50"
            >
              <span>
                <span className="block text-sm font-medium text-slate-900">{row.name}</span>
                <span className="block text-xs text-slate-500">
                  {[row.age && `${row.age}`, row.sex, row.phone, row.mrn].filter(Boolean).join(" · ")}
                </span>
              </span>
              <span className="text-xs text-slate-400">
                {new Date(row.created_at).toLocaleDateString()}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
