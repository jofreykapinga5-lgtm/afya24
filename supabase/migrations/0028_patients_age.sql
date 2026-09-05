-- Optional post-signup profile step (see account/welcome and
-- api/mobile/account/complete-profile): a first-time phone+OTP sign-up
-- collects nothing at all, then offers name/gender/age/location as an
-- entirely skippable follow-up screen, not blocking fields on the sign-up
-- form itself. A raw age number, not date_of_birth (patients already has
-- that column from the old password-based signup) -- deliberately chosen
-- over a date picker for the lowest-friction single-field input; it will
-- go stale over time since nothing recalculates it, an accepted tradeoff
-- for how little this app currently uses it.
alter table public.patients
  add column age integer check (age is null or (age >= 0 and age <= 130));

comment on column public.patients.age is
  'Self-reported age at the time it was entered (optional, from the post-signup welcome step) -- not derived from date_of_birth and not kept in sync with it.';
