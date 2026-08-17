"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/db/types";
import { createDemoClient, DEMO_MODE } from "@/lib/demo";

type BrowserSupabaseClient = ReturnType<typeof createBrowserClient<Database>>;

/**
 * Browser Supabase client. Safe to call repeatedly — @supabase/ssr memoises
 * the underlying client per set of credentials.
 */
export function createClient(): BrowserSupabaseClient {
  if (DEMO_MODE) {
    return createDemoClient() as unknown as BrowserSupabaseClient;
  }

  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
