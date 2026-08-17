import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui";
import { PageHeader } from "@/components/page-header";
import { DeletePrescriptionButton } from "@/app/(app)/prescriptions/delete-button";
import { likeTerm } from "@/lib/utils";

export const metadata = { title: "Prescriptions — Digital Rx" };

type Row = {
  id: string;
  serial: number;
  visit_date: string;
  summary: string;
  printed_at: string | null;
  patient_snapshot: { name?: string; age?: string; sex?: string } | null;
  patients: { id: string; name: string } | null;
};

export default async function PrescriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("prescriptions")
    .select("id, serial, visit_date, summary, printed_at, patient_snapshot, patients(id, name)")
    .order("visit_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);

  const term = q.trim();
  if (term) query = query.ilike("summary", `%${likeTerm(term)}%`);

  const { data } = await query;
  const rows = (data ?? []) as unknown as Row[];

  return (
    <div className="p-4">
      <PageHeader title="Prescriptions" count={rows.length}>
        <form className="flex gap-2" action="/prescriptions">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search diagnosis"
            className="!w-56"
          />
          <button type="submit" className="btn-secondary">
            Search
          </button>
        </form>
      </PageHeader>

      {rows.length === 0 ? (
        <EmptyState
          title={term ? "Nothing matched" : "No prescriptions saved yet"}
          description="Every prescription you save is kept here in full and can be reprinted exactly as issued."
          action={
            <Link href="/rx" className="btn-primary mt-2">
              New prescription
            </Link>
          }
        />
      ) : (
        <div className="panel divide-y divide-slate-100">
          {rows.map((row) => (
            <div key={row.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-900">
                  <span className="badge bg-slate-100 text-slate-600">#{row.serial}</span>
                  {row.patients?.name ?? row.patient_snapshot?.name ?? "—"}
                  <span className="text-xs font-normal text-slate-500">
                    {new Date(`${row.visit_date}T00:00:00`).toLocaleDateString()}
                  </span>
                  {row.printed_at && (
                    <span className="badge bg-brand-100 text-brand-800">printed</span>
                  )}
                </p>
                <p className="truncate text-xs text-slate-500">{row.summary || "—"}</p>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <Link href={`/rx/${row.id}`} className="btn-secondary btn-sm">
                  Open
                </Link>
                <Link href={`/rx/${row.id}?copy=1`} className="btn-ghost btn-sm">
                  Open as new
                </Link>
                <DeletePrescriptionButton id={row.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
