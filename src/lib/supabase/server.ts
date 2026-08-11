import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Server client for Server Components / Route Handlers / Server Actions.
// Carries the caller's session (if any), so it's still bound by RLS -- use
// this for anything a logged-in doctor/admin does. For patient-data reads
// that have no Supabase session to key off of, use service.ts instead.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component render -- fine as long as
            // middleware.ts is refreshing the session cookie on requests.
          }
        },
      },
    }
  );
}
