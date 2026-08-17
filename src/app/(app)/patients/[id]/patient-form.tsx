"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deletePatient, updatePatient } from "@/lib/actions/patients";
import { ConfirmButton, Field, Panel, Toast, useToast } from "@/components/ui";
import type { PatientRow } from "@/lib/db/types";

export function PatientForm({ patient }: { patient: PatientRow }) {
  const router = useRouter();
  const { toast, show, dismiss } = useToast();
  const [busy, setBusy] = useState(false);

  return (
    <>
      <Panel title="Record">
        <form
          className="space-y-3"
          action={async (formData) => {
            setBusy(true);
            const result = await updatePatient(patient.id, formData);
            setBusy(false);
            show(result.ok ? "Saved." : result.error, result.ok ? "success" : "error");
            if (result.ok) router.refresh();
          }}
        >
          <Field label="Name" htmlFor="name">
            <input id="name" name="name" type="text" defaultValue={patient.name} required />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Age" htmlFor="age">
              <input id="age" name="age" type="text" defaultValue={patient.age} />
            </Field>
            <Field label="Sex" htmlFor="sex">
              <select id="sex" name="sex" defaultValue={patient.sex ?? ""}>
                <option value="">—</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </Field>
            <Field label="Phone" htmlFor="phone">
              <input id="phone" name="phone" type="tel" defaultValue={patient.phone} />
            </Field>
            <Field label="MRN" htmlFor="mrn">
              <input id="mrn" name="mrn" type="text" defaultValue={patient.mrn} />
            </Field>
            <Field label="Weight" htmlFor="weight">
              <input id="weight" name="weight" type="text" defaultValue={patient.weight} />
            </Field>
          </div>

          <Field label="Address" htmlFor="address">
            <textarea id="address" name="address" rows={2} defaultValue={patient.address} />
          </Field>

          <Field label="Notes" htmlFor="notes" hint="Private to this record; never printed.">
            <textarea id="notes" name="notes" rows={3} defaultValue={patient.notes} />
          </Field>

          <div className="flex items-center justify-between gap-2 pt-1">
            <button type="submit" className="btn-primary" disabled={busy}>
              Save
            </button>
            <ConfirmButton
              label="Delete"
              confirmLabel="Delete permanently?"
              onConfirm={async () => {
                const result = await deletePatient(patient.id);
                if (result.ok) router.push("/patients");
                else show(result.error, "error");
              }}
            />
          </div>

          <p className="hint">
            Deleting a patient keeps their prescriptions as records but unlinks them.
          </p>
        </form>
      </Panel>

      {toast && <Toast message={toast.message} kind={toast.kind} onDismiss={dismiss} />}
    </>
  );
}
