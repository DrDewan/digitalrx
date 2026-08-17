"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-slate-100 p-6 text-center">
      <h1 className="text-lg font-semibold text-slate-900">Something went wrong</h1>
      <p className="max-w-md text-sm text-slate-600">
        Nothing you had typed is lost — an unsaved consultation is kept in this browser and will be
        offered again when you reopen the workspace.
      </p>
      {error.digest && <p className="text-xs text-slate-400">Reference: {error.digest}</p>}
      <button type="button" className="btn-primary mt-2" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
