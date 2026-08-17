import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/db/types";
import { createDemoClient, DEMO_MODE } from "@/lib/demo";

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 * Must be awaited: cookies() is async in Next 15.
 */
export async function createClient() {
  const cookieStore = await cookies();

  // Build a real typed client first so TypeScript derives the exact client
  // shape expected by the installed @supabase/ssr version. In demo mode this
  // client is never used for network requests.
  const realClient = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://demo.invalid",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "demo-anon-key",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component, where cookies are read-only.
            // The middleware refreshes the session, so this is safe to ignore.
          }
        },
      },
    },
  );

  if (DEMO_MODE) {
    return createDemoClient() as unknown as typeof realClient;
  }

  return realClient;
}

/** Returns the signed-in user, or null. */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
