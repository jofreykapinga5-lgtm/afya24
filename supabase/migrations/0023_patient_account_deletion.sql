-- Account deletion (App Store Guideline 5.1.1(v) -- real in-app self-service
-- deletion, not "contact support"). See frontend/src/lib/patient-account.ts's
-- deletePatientAccount() for the full design rationale: appointments,
-- payments, prescriptions, lab_orders, referrals, consultation records, and
-- visit documents all reference patients.id and are real clinical/financial
-- records other people (a doctor's own patient history, admin payment
-- reconciliation) depend on -- deleting the patients row outright would
-- either cascade-destroy or orphan all of that. So "delete my account" here
-- means: hard-delete the patient's own private self-tracking data (nothing
-- else references it), anonymize the identifying fields on the patients row
-- itself, and delete their Supabase Auth user so they can't sign back in --
-- the row survives (with deleted_at set) purely so every real clinical/
-- financial record still resolves correctly for the people who need it.
alter table public.patients add column if not exists deleted_at timestamptz;

comment on column public.patients.deleted_at is
  'Set when the patient requests account deletion. The row itself is kept (anonymized, not removed) so appointments/payments/prescriptions/lab_orders/etc. that reference this patient_id still resolve -- see deletePatientAccount() in lib/patient-account.ts.';
