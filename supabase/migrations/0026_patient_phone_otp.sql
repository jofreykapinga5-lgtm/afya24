-- Phone+OTP as the only patient credential (alongside Continue with Google):
-- password and date-of-birth collection are being dropped from sign-up/
-- sign-in entirely -- see lib/patient-otp.ts and account/actions.ts's new
-- requestPatientOtp/verifyPatientOtp. This table holds the outstanding code
-- for a phone number that may not have a patients row yet (a first-time
-- sign-up requests a code before any patient exists), so it's keyed on
-- phone, not patient_id -- unlike patients.password_reset_code_hash (added
-- in 0022), which that now-removed password-reset flow could afford to
-- store directly on an existing patient row.
--
-- One outstanding code per phone: requesting a new code overwrites any
-- unexpired one, same "only the latest code is valid" behavior the old
-- password-reset flow had. attempts guards brute-forcing a 6-digit code
-- within its TTL -- verifyPatientOtp rejects once attempts crosses a small
-- cap, forcing a fresh code rather than allowing unlimited guesses.
--
-- No RLS policies granted at all (RLS is still enabled, so this defaults to
-- deny-all for anon/authenticated) -- every access to this table is via the
-- service-role client (lib/patient-otp.ts), and there's no legitimate reason
-- for a patient's own session, let alone anyone else's, to read a hashed
-- code directly.
create table public.patient_otp_codes (
  phone text primary key,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.patient_otp_codes is
  'One outstanding sign-in/sign-up OTP per phone number. Row is deleted once verified or superseded by a fresh request.';
comment on column public.patient_otp_codes.code_hash is
  'HMAC hash of the current 6-digit code. Never the raw code.';
comment on column public.patient_otp_codes.attempts is
  'Failed verify attempts against this code. verifyPatientOtp refuses once this crosses its cap, requiring a fresh code.';

alter table public.patient_otp_codes enable row level security;
