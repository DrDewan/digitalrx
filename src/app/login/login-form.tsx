"use client";

import { useActionState, useState } from "react";
import { signIn, signUp, type AuthResult } from "@/lib/actions/auth";

const INITIAL: AuthResult = { error: null };

export function LoginForm({ next }: { next: string }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const action = mode === "signin" ? signIn : signUp;
  const [state, formAction, pending] = useActionState(action, INITIAL);

  return (
    <form action={formAction} className="space-y-4">
      <h1 className="text-base font-semibold text-slate-900">
        {mode === "signin" ? "Sign in" : "Create your account"}
      </h1>

      <input type="hidden" name="next" value={next} />

      {mode === "signup" && (
        <div>
          <label className="field-label" htmlFor="doctor_name">
            Doctor name
          </label>
          <input id="doctor_name" name="doctor_name" type="text" autoComplete="name" placeholder="Dr. …" />
        </div>
      )}

      <div>
        <label className="field-label" htmlFor="email">
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="email" required autoFocus />
      </div>

      <div>
        <label className="field-label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          required
          minLength={mode === "signup" ? 8 : undefined}
        />
      </div>

      {state?.error && (
        <p role="alert" className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.error}
        </p>
      )}

      {state?.notice && (
        <p role="status" className="rounded-md bg-brand-50 px-3 py-2 text-sm text-brand-800">
          {state.notice}
        </p>
      )}

      <button type="submit" className="btn-primary w-full" disabled={pending}>
        {pending ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
      </button>

      <button
        type="button"
        className="btn-ghost w-full text-xs"
        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
      >
        {mode === "signin" ? "First time here? Create an account" : "Already have an account? Sign in"}
      </button>
    </form>
  );
}
