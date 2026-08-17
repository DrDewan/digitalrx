"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useRxStore } from "@/lib/rx/store";
import { overlayTexts } from "@/lib/rx/compose";
import {
  migrateDraft,
  todayISO,
  type Language,
  type OverlayBoxes,
  type OverlaySectionKey,
  type RxDraft,
} from "@/lib/rx/types";
import { translate } from "@/lib/i18n";
import { savePrescription } from "@/lib/actions/prescriptions";
import { recordTemplateUse, saveTemplate } from "@/lib/actions/templates";
import { PatientBar } from "@/components/rx/patient-bar";
import {
  ComplaintsPanel,
  ExaminationPanel,
  HistoryPanel,
  InvestigationsPanel,
} from "@/components/rx/consultation-panels";
import { MedicinesPanel } from "@/components/rx/medicines-panel";
import { AdvicePanel, DiagnosisPanel, OverlayPanel, PlanNotesPanel } from "@/components/rx/rx-panels";
import { PrintSheet } from "@/components/rx/print-sheet";
import { Modal, Toast, useToast } from "@/components/ui";
import { IconEye, IconPlus, IconPrint, IconSave, IconTemplate } from "@/components/icons";

export type TemplateOption = { id: string; name: string; description: string; content: unknown };

export type WorkspaceProps = {
  boxes: OverlayBoxes;
  fontMax: number;
  fontMin: number;
  defaultLanguage: Language;
  templates: TemplateOption[];
  /** Set when the workspace was opened from a saved prescription. */
  initialDraft?: RxDraft | null;
  initialId?: string | null;
  initialSerial?: number | null;
};

export function Workspace({
  boxes,
  fontMax,
  fontMin,
  defaultLanguage,
  templates,
  initialDraft = null,
  initialId = null,
  initialSerial = null,
}: WorkspaceProps) {
  const router = useRouter();
  const { toast, show, dismiss } = useToast();
  const [pending, startTransition] = useTransition();

  const draft = useRxStore((s) => s.draft);
  const saveState = useRxStore((s) => s.saveState);
  const savedId = useRxStore((s) => s.savedId);
  const savedSerial = useRxStore((s) => s.savedSerial);
  const setDraft = useRxStore((s) => s.setDraft);
  const reset = useRxStore((s) => s.reset);
  const setLanguage = useRxStore((s) => s.setLanguage);
  const setVisitDate = useRxStore((s) => s.setVisitDate);
  const setSaveState = useRxStore((s) => s.setSaveState);
  const markSaved = useRxStore((s) => s.markSaved);
  const loadLocal = useRxStore((s) => s.loadLocal);
  const clearLocal = useRxStore((s) => s.clearLocal);

  const [preview, setPreview] = useState(false);
  const [guides, setGuides] = useState(false);
  const [outlines, setOutlines] = useState(false);
  const [pages, setPages] = useState(1);
  const [truncated, setTruncated] = useState<OverlaySectionKey[]>([]);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const savingRef = useRef(false);

  const language = draft.language;
  const t = useCallback(
    (key: Parameters<typeof translate>[1]) => translate(language, key),
    [language],
  );

  /* ---------------------------------------------------------------- boot -- */

  useEffect(() => {
    if (initialDraft) {
      setDraft(initialDraft, {
        savedId: initialId,
        savedSerial: initialSerial,
        persist: false,
      });
      return;
    }
    // Nothing loaded from the database: offer back whatever was left in this
    // browser. Read before resetting — reset() rewrites the stored copy, so
    // clearing first would destroy the very draft we are trying to recover.
    // loadLocal() drops savedId/savedSerial itself, so a restored draft can
    // never overwrite the record that happened to be open before.
    const restored = loadLocal();
    if (restored) show(translate(defaultLanguage, "draftRestored"), "info");
    else reset(defaultLanguage);

    // The date is filled in here, not during server rendering, so it is the
    // doctor's today rather than the server's.
    if (!useRxStore.getState().draft.visitDate) setVisitDate(todayISO());
    // Intentionally runs once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.body.classList.toggle("lang-bn", language === "bn");
  }, [language]);

  /* -------------------------------------------------------------- actions -- */

  const texts = useMemo(() => overlayTexts(draft), [draft]);

  const doSave = useCallback(
    async (options: { print?: boolean } = {}): Promise<boolean> => {
      if (!draft.patient.name.trim()) {
        show(t("patientNameRequired"), "error");
        return false;
      }
      // Guards against a double click or a repeated Ctrl+S issuing two
      // prescriptions (and two patient records) for one consultation.
      if (savingRef.current) return false;
      savingRef.current = true;
      setSaveState("saving");
      const result = await savePrescription(draft, {
        id: savedId,
        markPrinted: options.print,
      }).finally(() => {
        savingRef.current = false;
      });
      if (!result.ok) {
        setSaveState("error", result.error);
        show(result.error, "error");
        return false;
      }
      markSaved(result.data.id, result.data.serial);
      clearLocal();
      show(`${t("saved")} — ${t("serialNo")} ${result.data.serial}`, "success");
      router.refresh();
      return true;
    },
    [draft, savedId, setSaveState, markSaved, clearLocal, show, t, router],
  );

  const doPrint = useCallback(() => {
    if (truncated.length) {
      show(
        "Some text does not fit the pad and would be cut. Shorten it or lower the minimum font size in Settings.",
        "error",
      );
      return false;
    }
    // Let React flush the latest layout before handing over to the printer.
    window.setTimeout(() => window.print(), 60);
    return true;
  }, [truncated, show]);

  const saveAndPrint = useCallback(() => {
    // Refuse before saving, so a prescription is never stamped "printed" for a
    // print that was then blocked.
    if (truncated.length) {
      doPrint();
      return;
    }
    startTransition(async () => {
      const ok = await doSave({ print: true });
      if (ok) doPrint();
    });
  }, [doSave, doPrint, truncated]);

  const startNew = useCallback(() => {
    reset(defaultLanguage);
    clearLocal();
    setPreview(false);
    show(t("newPrescription"), "info");
  }, [reset, defaultLanguage, clearLocal, show, t]);

  /* ------------------------------------------------------------ shortcuts -- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.ctrlKey || e.metaKey;
      if (!meta) return;
      const key = e.key.toLowerCase();
      if (key === "s") {
        e.preventDefault();
        startTransition(async () => {
          await doSave();
        });
      } else if (key === "p") {
        e.preventDefault();
        doPrint();
      } else if (key === "e") {
        e.preventDefault();
        setPreview((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doSave, doPrint]);

  /* ---------------------------------------------------------------- view -- */

  const handleLayout = useCallback((info: { pages: number; truncated: OverlaySectionKey[] }) => {
    setPages(info.pages);
    setTruncated(info.truncated);
  }, []);

  const dirty = saveState === "dirty";

  return (
    <div className="flex min-h-full flex-col">
      <PatientBar language={language} />

      {/* Toolbar */}
      <div className="no-print flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2">
        <button type="button" className="btn-secondary btn-sm" onClick={startNew}>
          <IconPlus />
          {t("newPrescription")}
        </button>

        <button
          type="button"
          className={`btn-sm ${preview ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setPreview((p) => !p)}
          aria-pressed={preview}
        >
          <IconEye />
          {t("printPreview")}
        </button>

        <button
          type="button"
          className="btn-secondary btn-sm"
          onClick={() => setTemplateOpen(true)}
          disabled={!templates.length}
        >
          <IconTemplate />
          {t("templates")}
        </button>

        <button
          type="button"
          className="btn-secondary btn-sm"
          onClick={() => setSaveTemplateOpen(true)}
        >
          {t("saveAsTemplate")}
        </button>

        <div className="ml-auto flex items-center gap-3">
          {preview && (
            <>
              <label className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-600">
                <input
                  type="checkbox"
                  className="size-3.5"
                  checked={guides}
                  onChange={(e) => setGuides(e.target.checked)}
                />
                {t("showGuides")}
              </label>
              <label className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-600">
                <input
                  type="checkbox"
                  className="size-3.5"
                  checked={outlines}
                  onChange={(e) => setOutlines(e.target.checked)}
                />
                Box outlines
              </label>
            </>
          )}

          <div
            className="inline-flex overflow-hidden rounded-md border border-slate-300"
            role="group"
            aria-label={t("language")}
          >
            {(["en", "bn"] as const).map((code) => (
              <button
                key={code}
                type="button"
                aria-pressed={language === code}
                onClick={() => setLanguage(code)}
                className={`px-2.5 py-1 text-xs font-medium transition ${
                  language === code
                    ? "bg-brand-600 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {code === "en" ? "EN" : "বাংলা"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Status strip */}
      <div className="no-print flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-slate-200 bg-white px-3 py-1.5 text-xs">
        <span className={dirty ? "text-amber-700" : "text-slate-500"}>
          {saveState === "saving"
            ? t("saving")
            : dirty
              ? t("unsavedChanges")
              : savedId
                ? `${t("allSaved")} · ${t("serialNo")} ${savedSerial ?? "—"}`
                : t("allSaved")}
        </span>
        <span className="text-slate-500">
          {pages} {pages === 1 ? "page" : "pages"}
        </span>
        {truncated.length > 0 && (
          <span className="font-medium text-rose-700">
            Text overflows: {truncated.join(", ")}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="grid flex-1 gap-3 p-3 xl:grid-cols-2">
        <div className="space-y-3">
          <ComplaintsPanel language={language} />
          <HistoryPanel language={language} />
          <ExaminationPanel language={language} />
          <InvestigationsPanel language={language} />
        </div>

        <div className="space-y-3">
          <MedicinesPanel language={language} />
          <DiagnosisPanel language={language} />
          <AdvicePanel language={language} />
          <PlanNotesPanel language={language} />
          <OverlayPanel language={language} />
        </div>
      </div>

      {/* The sheet stays mounted at all times so the layout engine can measure
          it; `preview` decides whether it is on-screen or parked off-canvas. */}
      <div className={preview ? "px-3 pb-3" : ""}>
        {preview && (
          <p className="no-print mb-1.5 text-xs text-slate-500">
            {t("printPreview")} — A4, {pages} {pages === 1 ? "page" : "pages"}. Feed the
            pre-printed pad; only this text is printed.
          </p>
        )}
        <PrintSheet
          texts={texts}
          boxes={boxes}
          fontMax={fontMax}
          fontMin={fontMin}
          preview={preview}
          showGuides={guides}
          showBoxOutlines={outlines}
          onLayout={handleLayout}
        />
      </div>

      {/* Action bar */}
      <div className="no-print sticky bottom-0 z-20 flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 bg-white/95 px-3 py-2 backdrop-blur">
        <button
          type="button"
          className="btn-secondary"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await doSave();
            })
          }
        >
          <IconSave />
          {t("save")}
        </button>
        <button type="button" className="btn-secondary" onClick={doPrint}>
          <IconPrint />
          {t("print")}
        </button>
        <button type="button" className="btn-primary" disabled={pending} onClick={saveAndPrint}>
          <IconPrint />
          {t("saveAndPrint")}
        </button>
      </div>

      {/* Apply a template */}
      <Modal
        open={templateOpen}
        onClose={() => setTemplateOpen(false)}
        title={t("templates")}
        width="max-w-lg"
      >
        <p className="hint mb-3">{t("templateOverwriteWarning")}</p>
        <ul className="divide-y divide-slate-100">
          {templates.map((tpl) => (
            <li key={tpl.id}>
              <button
                type="button"
                className="w-full rounded-md px-2 py-2.5 text-left hover:bg-slate-50"
                onClick={() => {
                  const next = migrateDraft(tpl.content, language);
                  setDraft(
                    { ...next, patient: draft.patient, visitDate: draft.visitDate, language },
                    // Applying a template is an edit, not a load: keep the record
                    // identity but mark the draft unsaved.
                    { savedId, savedSerial, saveState: "dirty" },
                  );
                  void recordTemplateUse(tpl.id);
                  setTemplateOpen(false);
                  show(tpl.name, "success");
                }}
              >
                <span className="block text-sm font-medium text-slate-900">{tpl.name}</span>
                {tpl.description && (
                  <span className="block text-xs text-slate-500">{tpl.description}</span>
                )}
              </button>
            </li>
          ))}
          {!templates.length && <li className="hint p-2">{t("noTemplates")}</li>}
        </ul>
      </Modal>

      <SaveTemplateDialog
        open={saveTemplateOpen}
        onClose={() => setSaveTemplateOpen(false)}
        language={language}
        onSaved={(name) => {
          setSaveTemplateOpen(false);
          show(`${t("templateSaved")} ${name}`, "success");
          router.refresh();
        }}
      />

      {toast && <Toast message={toast.message} kind={toast.kind} onDismiss={dismiss} />}
    </div>
  );
}

function SaveTemplateDialog({
  open,
  onClose,
  onSaved,
  language,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (name: string) => void;
  language: Language;
}) {
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const draft = useRxStore((s) => s.draft);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("saveAsTemplate")}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose}>
            {t("cancel")}
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              const result = await saveTemplate(name, description, draft);
              setBusy(false);
              if (!result.ok) {
                setError(result.error);
                return;
              }
              setError(null);
              const saved = name;
              setName("");
              setDescription("");
              onSaved(saved);
            }}
          >
            {t("save")}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="hint">
          The patient block is never stored in a template — only the clinical content.
        </p>
        <div>
          <label className="field-label" htmlFor="tpl-name">
            {t("templateName")}
          </label>
          <input
            id="tpl-name"
            type="text"
            value={name}
            autoFocus
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="field-label" htmlFor="tpl-desc">
            {t("optional")}
          </label>
          <input
            id="tpl-desc"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-rose-700">{error}</p>}
      </div>
    </Modal>
  );
}
