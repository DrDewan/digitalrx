"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/types";
import { createDemoClient, DEMO_MODE } from "@/lib/demo";

/**
 * Browser Supabase client. Safe to call repeatedly — @supabase/ssr memoises
 * the underlying client per set of credentials.
 */
export function createClient(): SupabaseClient<Database> {
  if (DEMO_MODE) {
    return createDemoClient() as unknown as SupabaseClient<Database>;
  }

  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
