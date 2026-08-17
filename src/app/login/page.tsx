import { Suspense } from "react";
import { LoginForm } from "@/app/login/login-form";

export const metadata = { title: "Sign in — Digital Rx" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-chrome-900 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-brand-500 text-lg font-bold text-white">
            ℞
          </span>
          <div>
            <p className="text-lg font-semibold tracking-tight text-white">Digital Rx</p>
            <p className="text-sm text-slate-400">Prescription workspace</p>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-lg">
          <Suspense fallback={null}>
            <LoginForm next={next ?? "/rx"} />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-xs leading-relaxed text-slate-500">
          Patient data is stored in your own Supabase project and is visible only to this account.
        </p>
      </div>
    </main>
  );
}
