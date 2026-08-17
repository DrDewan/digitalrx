import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-slate-100 p-6 text-center">
      <p className="text-sm font-semibold tracking-wide text-slate-500 uppercase">Not found</p>
      <h1 className="text-lg font-semibold text-slate-900">That record does not exist</h1>
      <p className="max-w-sm text-sm text-slate-600">
        It may have been deleted, or the link may belong to another account.
      </p>
      <Link href="/rx" className="btn-primary mt-2">
        Back to the workspace
      </Link>
    </main>
  );
}
