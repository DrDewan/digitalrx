"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRxStore } from "@/lib/rx/store";
import { translate } from "@/lib/i18n";
import type { Language, MedicineLine } from "@/lib/rx/types";
import type { MedicineSearchRow } from "@/lib/db/types";
import {
  DURATION_PRESETS,
  FREQUENCY_PRESETS,
  INSTRUCTION_PRESETS,
} from "@/lib/clinical/data";
import { Panel, PresetChips } from "@/components/ui";
import { likeTerm } from "@/lib/utils";
import { IconArrowDown, IconArrowUp, IconPlus, IconSearch, IconTrash } from "@/components/icons";

type T = (key: Parameters<typeof translate>[1]) => string;

export function MedicinesPanel({ language }: { language: Language }) {
  const t: T = (key) => translate(language, key);
  const medicines = useRxStore((s) => s.draft.medicines);
  const addMedicine = useRxStore((s) => s.addMedicine);

  return (
    <Panel
      title={t("medicines")}
      actions={
        <button type="button" className="btn-secondary btn-sm" onClick={() => addMedicine()}>
          <IconPlus />
          {t("addLine")}
        </button>
      }
    >
      <MedicineSearch language={language} />

      {medicines.length === 0 ? (
        <p className="hint py-2">{t("noMedicines")}</p>
      ) : (
        <ol className="space-y-2">
          {medicines.map((line, index) => (
            <MedicineRow
              key={line.id}
              line={line}
              index={index}
              total={medicines.length}
              language={language}
            />
          ))}
        </ol>
      )}
    </Panel>
  );
}

/* -------------------------------------------------------------------------- */
/* Type-ahead over the shared catalogue plus the doctor's own drugs            */
/* -------------------------------------------------------------------------- */

function MedicineSearch({ language }: { language: Language }) {
  const t: T = (key) => translate(language, key);
  const addMedicine = useRxStore((s) => s.addMedicine);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MedicineSearchRow[]>([]);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const search = useCallback(async (q: string) => {
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const pattern = `%${likeTerm(term)}%`;
    const { data } = await supabase
      .from("medicines_all")
      .select("*")
      .or(`name.ilike.${pattern},generic.ilike.${pattern}`)
      .order("use_count", { ascending: false })
      .order("name", { ascending: true })
      .limit(20);
    setResults((data as MedicineSearchRow[]) ?? []);
    setHighlight(0);
    setLoading(false);
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => void search(query), 180);
    return () => window.clearTimeout(handle);
  }, [query, search]);

  // Ctrl/Cmd+K focuses the medicine search from anywhere in the workspace.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const pick = (row: MedicineSearchRow) => {
    addMedicine({
      name: row.name,
      strength: row.strength ?? "",
      dose: row.default_dose,
      frequency: row.default_frequency,
      duration: row.default_duration,
      instructions: row.default_instructions,
    });
    setQuery("");
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || !results.length) {
      if (e.key === "Enter" && query.trim()) {
        e.preventDefault();
        addMedicine({ name: query.trim() });
        setQuery("");
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(results[highlight]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={boxRef} className="relative">
      <IconSearch className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-slate-400" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        placeholder={`${t("medicineSearch")}  (Ctrl+K)`}
        autoComplete="off"
        className="!pl-8"
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />

      {open && query.trim().length >= 2 && (
        <ul className="absolute z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg">
          {loading && <li className="px-3 py-2 text-sm text-slate-500">{t("loading")}</li>}

          {!loading && results.length === 0 && (
            <li className="px-3 py-2 text-sm text-slate-500">
              {t("none")} —{" "}
              <button
                type="button"
                className="font-medium text-brand-700 underline-offset-2 hover:underline"
                onMouseDown={(e) => {
                  e.preventDefault();
                  addMedicine({ name: query.trim() });
                  setQuery("");
                }}
              >
                {t("add")} &ldquo;{query.trim()}&rdquo;
              </button>
            </li>
          )}

          {results.map((row, index) => (
            <li key={`${row.id}-${row.is_custom}`}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(row);
                }}
                onMouseEnter={() => setHighlight(index)}
                className={`flex w-full items-baseline justify-between gap-3 px-3 py-2 text-left text-sm ${
                  index === highlight ? "bg-brand-50" : "hover:bg-slate-50"
                }`}
              >
                <span>
                  <span className="font-medium text-slate-900">{row.name}</span>
                  {row.strength && <span className="ml-1.5 text-slate-600">{row.strength}</span>}
                  <span className="ml-2 text-xs text-slate-500">{row.generic}</span>
                </span>
                <span className="shrink-0 text-[11px] text-slate-400">
                  {row.is_custom ? "mine" : row.form || row.category}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* One prescribed line                                                         */
/* -------------------------------------------------------------------------- */

function MedicineRow({
  line,
  index,
  total,
  language,
}: {
  line: MedicineLine;
  index: number;
  total: number;
  language: Language;
}) {
  const t: T = (key) => translate(language, key);
  const update = useRxStore((s) => s.updateMedicine);
  const remove = useRxStore((s) => s.removeMedicine);
  const move = useRxStore((s) => s.moveMedicine);

  const set = (partial: Partial<MedicineLine>) => update(line.id, partial);

  return (
    <li className="rounded-lg border border-slate-200 bg-slate-50/60 p-2.5">
      <div className="mb-2 flex items-start gap-2">
        <span className="mt-1.5 w-5 shrink-0 text-center text-xs font-semibold text-slate-400">
          {index + 1}
        </span>

        <div className="grid flex-1 gap-2 sm:grid-cols-[2fr_1fr]">
          <input
            type="text"
            aria-label={t("medicineName")}
            placeholder={t("medicineName")}
            value={line.name}
            onChange={(e) => set({ name: e.target.value })}
          />
          <input
            type="text"
            aria-label={t("strength")}
            placeholder={t("strength")}
            value={line.strength}
            onChange={(e) => set({ strength: e.target.value })}
          />
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            className="btn-ghost btn-sm"
            aria-label={t("moveUp")}
            disabled={index === 0}
            onClick={() => move(line.id, -1)}
          >
            <IconArrowUp />
          </button>
          <button
            type="button"
            className="btn-ghost btn-sm"
            aria-label={t("moveDown")}
            disabled={index === total - 1}
            onClick={() => move(line.id, 1)}
          >
            <IconArrowDown />
          </button>
          <button
            type="button"
            className="btn-ghost btn-sm text-rose-600 hover:bg-rose-50"
            aria-label={t("remove")}
            onClick={() => remove(line.id)}
          >
            <IconTrash />
          </button>
        </div>
      </div>

      <div className="grid gap-2 pl-7 sm:grid-cols-3">
        <div>
          <label className="field-label">{t("dose")}</label>
          <input type="text" value={line.dose} onChange={(e) => set({ dose: e.target.value })} />
        </div>
        <div>
          <label className="field-label">{t("frequency")}</label>
          <input
            type="text"
            value={line.frequency}
            onChange={(e) => set({ frequency: e.target.value })}
          />
          <PresetChips
            presets={FREQUENCY_PRESETS}
            active={line.frequency}
            onPick={(v) => set({ frequency: v })}
          />
        </div>
        <div>
          <label className="field-label">{t("duration")}</label>
          <input
            type="text"
            value={line.duration}
            onChange={(e) => set({ duration: e.target.value })}
          />
          <PresetChips
            presets={DURATION_PRESETS}
            active={line.duration}
            onPick={(v) => set({ duration: v })}
          />
        </div>
      </div>

      <div className="mt-2 pl-7">
        <label className="field-label">{t("instructions")}</label>
        <input
          type="text"
          value={line.instructions}
          onChange={(e) => set({ instructions: e.target.value })}
        />
        <PresetChips
          presets={INSTRUCTION_PRESETS}
          active={line.instructions}
          onPick={(v) => set({ instructions: v })}
        />
      </div>
    </li>
  );
}
