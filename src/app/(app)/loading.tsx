export default function Loading() {
  return (
    <div className="space-y-3 p-4">
      <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
      <div className="grid gap-3 xl:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-[0.625rem] bg-white" />
        ))}
      </div>
    </div>
  );
}
