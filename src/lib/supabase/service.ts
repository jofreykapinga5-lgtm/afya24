import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client: bypasses Row Level Security entirely. Only call this
// from server-side code that has already checked the caller is allowed to do
// what it's about to do -- a verified staff role, or (for patients, who have
// no Supabase Auth session in v1) the reference-number + identity-confirmation
// check described in DATA-MODEL.md. The `server-only` import makes it a build
// error to pull this into a client bundle by mistake; do not remove it.
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
