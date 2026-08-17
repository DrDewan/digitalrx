export function PageHeader({
  title,
  count,
  description,
  children,
}: {
  title: string;
  count?: number;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-slate-900">
          {title}
          {typeof count === "number" && (
            <span className="badge bg-slate-200 text-slate-700">{count}</span>
          )}
        </h1>
        {description && <p className="hint mt-0.5">{description}</p>}
      </div>
      {children}
    </header>
  );
}
