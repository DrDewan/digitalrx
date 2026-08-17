import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui";
import { PageHeader } from "@/components/page-header";
import { likeTerm } from "@/lib/utils";

export const metadata = { title: "Patients — Digital Rx" };

type PatientWithCount = {
  id: string;
  name: string;
  age: string;
  sex: string | null;
  phone: string;
  mrn: string;
  created_at: string;
  prescriptions: { count: number }[];
};

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("patients")
    .select("id, name, age, sex, phone, mrn, created_at, prescriptions(count)")
    .order("created_at", { ascending: false })
    .limit(200);

  const term = q.trim();
  if (term) {
    const pattern = `%${likeTerm(term)}%`;
    query = query.or(`name.ilike.${pattern},phone.ilike.${pattern},mrn.ilike.${pattern}`);
  }

  const { data } = await query;
  const patients = (data ?? []) as unknown as PatientWithCount[];

  return (
    <div className="p-4">
      <PageHeader title="Patients" count={patients.length}>
        <form className="flex gap-2" action="/patients">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Name, phone or MRN"
            className="!w-56"
          />
          <button type="submit" className="btn-secondary">
            Search
          </button>
        </form>
      </PageHeader>

      {patients.length === 0 ? (
        <EmptyState
          title={term ? "No matching patients" : "No patients yet"}
          description={
            term
              ? "Try a different name, phone number or MRN."
              : "A patient record is created automatically the first time you save a prescription for them."
          }
          action={
            <Link href="/rx" className="btn-primary mt-2">
              New prescription
            </Link>
          }
        />
      ) : (
        <div className="panel divide-y divide-slate-100">
          {patients.map((patient) => (
            <Link
              key={patient.id}
              href={`/patients/${patient.id}`}
              className="flex items-center justify-between gap-4 px-4 py-3 transition hover:bg-slate-50"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">{patient.name}</p>
                <p className="truncate text-xs text-slate-500">
                  {[patient.age, patient.sex, patient.phone, patient.mrn]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <span className="badge bg-slate-100 text-slate-700">
                  {patient.prescriptions?.[0]?.count ?? 0} visits
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
