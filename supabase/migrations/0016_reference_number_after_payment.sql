-- The hospital reference number is now assigned only once a patient's first
-- consultation payment is confirmed (see lib/patient-account.ts's
-- ensurePatientReferenceNumber, called from lib/payments/reconcile.ts and
-- admin's manual payment-confirm action) -- not at intake time, when a
-- patient may never actually pay. Patients created before this migration
-- keep the reference number they already have; new patients start with
-- null until their first payment lands. The unique constraint still holds:
-- Postgres allows multiple nulls in a unique column, only actual assigned
-- numbers must stay distinct from each other.
alter table public.patients
  alter column hospital_reference_number drop not null;
