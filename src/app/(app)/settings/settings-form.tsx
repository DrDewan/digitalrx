"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateProfile } from "@/lib/actions/profile";
import type { Profile } from "@/lib/db/profile";
import { OVERLAY_SECTIONS, type OverlayBoxes, type OverlaySectionKey } from "@/lib/rx/types";
import { PrintSheet } from "@/components/rx/print-sheet";
import { Field, Panel, Toast, useToast } from "@/components/ui";
import { IconPrint } from "@/components/icons";

const SECTION_LABELS: Record<OverlaySectionKey, string> = {
  disease: "Disease description (left column)",
  treatment: "Treatment (right column)",
  diagnosis: "Clinical diagnosis",
  advice: "Advice",
};

/** Filler that shows where each block starts and ends on the printed page. */
function calibrationText(section: OverlaySectionKey, box: OverlayBoxes[OverlaySectionKey]) {
  const head = `▛ ${SECTION_LABELS[section]}`;
  const geom = `top ${box.top}mm · left ${box.left}mm · ${box.width}×${box.height}mm`;
  const filler = Array.from({ length: 40 }, (_, i) => `line ${i + 1} ${"·".repeat(60)}`).join("\n");
  return `${head}\n${geom}\n${filler}`;
}

export function SettingsForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const { toast, show, dismiss } = useToast();
  const [busy, setBusy] = useState(false);
  const [boxes, setBoxes] = useState<OverlayBoxes>(profile.overlay_boxes);
  const [fontMax, setFontMax] = useState(profile.overlay_font_max);
  const [fontMin, setFontMin] = useState(profile.overlay_font_min);
  const [calibrating, setCalibrating] = useState(false);

  const setBox = (section: OverlaySectionKey, key: keyof OverlayBoxes["disease"], value: number) => {
    setBoxes((prev) => ({ ...prev, [section]: { ...prev[section], [key]: value } }));
  };

  const calibrationTexts = OVERLAY_SECTIONS.reduce(
    (acc, section) => {
      acc[section] = calibrationText(section, boxes[section]);
      return acc;
    },
    {} as Record<OverlaySectionKey, string>,
  );

  return (
    <>
      <form
        className="grid gap-4 xl:grid-cols-2"
        action={async (formData) => {
          setBusy(true);
          const result = await updateProfile(formData);
          setBusy(false);
          show(result.ok ? "Settings saved." : result.error, result.ok ? "success" : "error");
          if (result.ok) router.refresh();
        }}
      >
        <div className="space-y-4">
          <Panel title="Prescriber">
            <Field label="Doctor name" htmlFor="doctor_name">
              <input
                id="doctor_name"
                name="doctor_name"
                type="text"
                defaultValue={profile.doctor_name}
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Qualifications" htmlFor="qualifications">
                <input
                  id="qualifications"
                  name="qualifications"
                  type="text"
                  defaultValue={profile.qualifications}
                />
              </Field>
              <Field label="BMDC / registration no." htmlFor="bmdc_no">
                <input id="bmdc_no" name="bmdc_no" type="text" defaultValue={profile.bmdc_no} />
              </Field>
            </div>
          </Panel>

          <Panel title="Clinic">
            <Field label="Clinic or hospital" htmlFor="clinic_name">
              <input
                id="clinic_name"
                name="clinic_name"
                type="text"
                defaultValue={profile.clinic_name}
              />
            </Field>
            <Field label="Address" htmlFor="clinic_address">
              <textarea
                id="clinic_address"
                name="clinic_address"
                rows={2}
                defaultValue={profile.clinic_address}
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Phone" htmlFor="clinic_phone">
                <input
                  id="clinic_phone"
                  name="clinic_phone"
                  type="tel"
                  defaultValue={profile.clinic_phone}
                />
              </Field>
              <Field label="Email" htmlFor="clinic_email">
                <input
                  id="clinic_email"
                  name="clinic_email"
                  type="email"
                  defaultValue={profile.clinic_email}
                />
              </Field>
            </div>
            <Field
              label="Working language"
              htmlFor="default_language"
              hint="Sets the language a new prescription starts in. You can still switch per prescription."
            >
              <select
                id="default_language"
                name="default_language"
                defaultValue={profile.default_language}
              >
                <option value="en">English</option>
                <option value="bn">বাংলা</option>
              </select>
            </Field>
          </Panel>
        </div>

        <Panel
          title="Print calibration"
          actions={
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={() => {
                setCalibrating(true);
                const done = () => {
                  setCalibrating(false);
                  window.removeEventListener("afterprint", done);
                };
                window.addEventListener("afterprint", done);
                window.setTimeout(() => window.print(), 150);
              }}
            >
              <IconPrint />
              Print calibration sheet
            </button>
          }
        >
          <p className="hint">
            Each block is positioned in millimetres from the top-left corner of the A4 sheet. Print
            the calibration sheet, hold it against a blank pad, and adjust until every block sits
            inside its printed area. Nothing else about the layout changes.
          </p>

          <div className="grid gap-3">
            {OVERLAY_SECTIONS.map((section) => (
              <fieldset key={section} className="rounded-md border border-slate-200 p-3">
                <legend className="px-1 text-xs font-semibold text-slate-700">
                  {SECTION_LABELS[section]}
                </legend>
                <div className="grid grid-cols-4 gap-2">
                  {(["top", "left", "width", "height"] as const).map((key) => (
                    <label key={key} className="block">
                      <span className="field-label">{key} mm</span>
                      <input
                        type="number"
                        name={`${section}_${key}`}
                        min={0}
                        max={400}
                        step={1}
                        value={boxes[section][key]}
                        onChange={(e) => setBox(section, key, Number(e.target.value))}
                      />
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Largest font (pt)" htmlFor="overlay_font_max">
              <input
                id="overlay_font_max"
                name="overlay_font_max"
                type="number"
                min={6}
                max={24}
                step={0.5}
                value={fontMax}
                onChange={(e) => setFontMax(Number(e.target.value))}
              />
            </Field>
            <Field
              label="Smallest font (pt)"
              htmlFor="overlay_font_min"
              hint="Text shrinks to this size before it breaks onto another page."
            >
              <input
                id="overlay_font_min"
                name="overlay_font_min"
                type="number"
                min={6}
                max={24}
                step={0.5}
                value={fontMin}
                onChange={(e) => setFontMin(Number(e.target.value))}
              />
            </Field>
          </div>

          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? "Saving…" : "Save settings"}
          </button>
        </Panel>
      </form>

      {/* Mounted only while calibrating so it never competes with the workspace sheet. */}
      {calibrating && (
        <PrintSheet
          texts={calibrationTexts}
          boxes={boxes}
          fontMax={fontMax}
          fontMin={fontMin}
          preview={false}
          showBoxOutlines
          printBoxOutlines
        />
      )}

      {toast && <Toast message={toast.message} kind={toast.kind} onDismiss={dismiss} />}
    </>
  );
}
