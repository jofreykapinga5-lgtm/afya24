import { createBrowserClient } from "@supabase/ssr";

// Browser client: safe to import from "use client" components. Scoped by
// RLS to whatever the current session (or anon role) is allowed to see --
// see supabase/migrations/0002_rls.sql for what that actually covers.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
