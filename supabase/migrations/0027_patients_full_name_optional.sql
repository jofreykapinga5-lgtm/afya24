-- Phone+OTP sign-up (see 0026_patient_phone_otp.sql and lib/patient-account.ts's
-- resolvePatientForVerifiedPhone) deliberately collects nothing but a phone
-- number -- no name, matching account/sign-up's own UI. patients.full_name
-- was still `not null` from the original password-based signUp, which always
-- had a first/last name form field to satisfy it; a phone-only sign-up has
-- nothing to put there. The rest of the app already treats a missing name as
-- a normal, handled state (the dashboard greeting falls back to placeholder
-- copy, toTitleCase(...) call sites already null-check first), so this is
-- catching the schema up to code that already expected this, not a new gap.
alter table public.patients
  alter column full_name drop not null;
