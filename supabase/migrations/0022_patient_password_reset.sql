-- SMS-based password reset for patients. Patients sign in with a synthetic
-- email (see lib/patient-auth-email.ts), so Supabase's normal emailed-link
-- reset flow (used for staff -- see doctor/actions.ts) can't reach them at
-- all. This is a code-based flow instead: a 6-digit code is texted to the
-- patient's real phone, hashed (not stored raw) alongside an expiry, and
-- checked at verification time -- see lib/patient-password-reset.ts.

alter table public.patients
  add column password_reset_code_hash text,
  add column password_reset_code_expires_at timestamptz;

comment on column public.patients.password_reset_code_hash is
  'HMAC hash of the current SMS reset code, if any is outstanding. Never the raw code.';
comment on column public.patients.password_reset_code_expires_at is
  'When the outstanding reset code stops being valid. Both columns are cleared back to null once used or once a new code is requested.';
