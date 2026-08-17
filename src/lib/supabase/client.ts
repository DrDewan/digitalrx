"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/db/types";
import { createDemoClient, DEMO_MODE } from "@/lib/demo";

/**
 * Browser Supabase client. Safe to call repeatedly — @supabase/ssr memoises
 * the underlying client per set of credentials.
 */
export function createClient() {
  // Build a real typed client first so TypeScript derives the exact client
  // shape expected by the installed @supabase/ssr version. In demo mode this
  // client is never used for network requests.
  const realClient = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://demo.invalid",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "demo-anon-key",
  );

  if (DEMO_MODE) {
    return createDemoClient() as unknown as typeof realClient;
  }

  return realClient;
}
