import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui";
import { PageHeader } from "@/components/page-header";
import { DeleteTemplateButton } from "@/app/(app)/templates/delete-button";
import { migrateDraft } from "@/lib/rx/types";

export const metadata = { title: "Templates — Digital Rx" };

export default async function TemplatesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("templates")
    .select("id, name, description, content, use_count, updated_at")
    .order("use_count", { ascending: false })
    .order("name");

  const templates = data ?? [];

  return (
    <div className="p-4">
      <PageHeader
        title="Templates"
        count={templates.length}
        description="A saved consultation you can drop into a new prescription. Patient details are never stored in one."
      >
        <Link href="/rx" className="btn-primary">
          New prescription
        </Link>
      </PageHeader>

      {templates.length === 0 ? (
        <EmptyState
          title="No templates yet"
          description="Fill in a consultation you repeat often, then choose Save as template in the workspace toolbar."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {templates.map((tpl) => {
            const draft = migrateDraft(tpl.content);
            const meds = draft.medicines.filter((m) => m.name.trim()).length;
            return (
              <article key={tpl.id} className="panel flex flex-col">
                <div className="panel-body flex-1">
                  <h2 className="text-sm font-semibold text-slate-900">{tpl.name}</h2>
                  {tpl.description && <p className="hint">{tpl.description}</p>}
                  <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span>{meds} medicines</span>
                    <span>{draft.investigations.length} tests</span>
                    <span>{draft.advice.length} advice lines</span>
                    <span>used {tpl.use_count}×</span>
                  </dl>
                  {draft.diagnosis && (
                    <p className="line-clamp-2 text-xs text-slate-600">{draft.diagnosis}</p>
                  )}
                </div>
                <footer className="flex items-center justify-between gap-2 border-t border-slate-200 px-3.5 py-2">
                  <Link href="/rx" className="btn-secondary btn-sm">
                    Use in workspace
                  </Link>
                  <DeleteTemplateButton id={tpl.id} />
                </footer>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
