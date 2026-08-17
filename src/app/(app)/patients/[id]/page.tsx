import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { PatientForm } from "@/app/(app)/patients/[id]/patient-form";
import type { PatientRow, PrescriptionRow } from "@/lib/db/types";

export const metadata = { title: "Patient — Digital Rx" };

export default async function PatientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: patient }, { data: visits }] = await Promise.all([
    supabase.from("patients").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("prescriptions")
      .select("id, serial, visit_date, summary, printed_at, created_at")
      .eq("patient_id", id)
      .order("visit_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  if (!patient) notFound();

  const rows = (visits ?? []) as Pick<
    PrescriptionRow,
    "id" | "serial" | "visit_date" | "summary" | "printed_at" | "created_at"
  >[];

  return (
    <div className="p-4">
      <PageHeader title={(patient as PatientRow).name} description={`${rows.length} visits`}>
        <Link href="/patients" className="btn-secondary">
          Back to patients
        </Link>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
        <PatientForm patient={patient as PatientRow} />

        <section className="panel">
          <header className="panel-header">
            <h2 className="panel-title">Visit history</h2>
          </header>
          {rows.length === 0 ? (
            <p className="hint p-4">No prescriptions recorded for this patient yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {rows.map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-medium text-slate-900">
                      <span className="badge bg-slate-100 text-slate-600">#{row.serial}</span>
                      {new Date(`${row.visit_date}T00:00:00`).toLocaleDateString()}
                      {row.printed_at && (
                        <span className="badge bg-brand-100 text-brand-800">printed</span>
                      )}
                    </p>
                    <p className="truncate text-xs text-slate-500">{row.summary || "—"}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Link href={`/rx/${row.id}`} className="btn-secondary btn-sm">
                      Open
                    </Link>
                    <Link href={`/rx/${row.id}?copy=1`} className="btn-ghost btn-sm">
                      Open as new
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
