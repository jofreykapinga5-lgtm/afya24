import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Stateless anon-key client for one-off server-side auth calls (the mobile
// API's sign-in/sign-up endpoints) that need Supabase's real password
// verification but have no cookie jar to persist a session into. Different
// from both of this app's other two Supabase clients: lib/supabase/server.ts
// is cookie-backed for browser callers, lib/supabase/service.ts bypasses RLS
// for already-authorized server logic -- this one is scoped to exactly what
// a mobile client's fetch call needs: verify credentials, get back a user
// id, done. autoRefreshToken/persistSession are off since nothing here holds
// onto the client across requests; the mobile app carries its own session
// (the afya24_patient_session JWT) instead, same as every other consumer of
// this app's dual-token model.
export function createStatelessAuthClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
