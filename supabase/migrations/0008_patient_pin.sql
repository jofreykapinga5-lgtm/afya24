-- Adds an optional PIN as a stronger alternative to date-of-birth for
-- return-visit lookup (src/app/lookup/actions.ts). Nullable and additive so
-- existing patients without a PIN keep working via the DOB fallback --
-- src/lib/patient-pin.ts and the updated lookupPatient action handle both.

alter table public.patients
  add column if not exists pin_hash text;
