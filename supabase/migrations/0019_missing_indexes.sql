-- Foreign keys and frequently-filtered columns that were missing an index.
-- Postgres does NOT auto-index plain foreign keys (only primary keys and
-- unique constraints), so these were doing full table scans -- harmless at
-- today's row counts, but cheap to add now rather than retrofit once these
-- tables have real volume.

-- Checked on every doctor dashboard page load (getDoctorDashboardContext)
-- and every video-room join (api/video/room/route.ts's isProvider check).
create index if not exists idx_providers_user_id on public.providers (user_id);

-- Checked on every doctors listing page load and every individual doctor
-- profile page load (both filter .eq("profile_status", "active")).
create index if not exists idx_providers_profile_status on public.providers (profile_status);

-- Checked in the patient-history route, the video queue's in-app-mode
-- lookup, and payment reconciliation.
create index if not exists idx_consultation_orders_appointment_id
  on public.consultation_orders (appointment_id);

-- Matches lookupPatient's exact brute-force-window query shape
-- (.eq("searched_value_hash", ...).eq("lookup_method", ...).gte("created_at", ...)).
-- This table grows with every lookup attempt, including failed/bot ones
-- rate limiting slows but doesn't stop, so it can outgrow the app's real
-- business tables faster than expected.
create index if not exists idx_patient_lookup_events_brute_force
  on public.patient_lookup_events (searched_value_hash, lookup_method, created_at);
