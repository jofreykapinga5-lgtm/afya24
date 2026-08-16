-- Wires up the previously-unused public.payments table as the ledger for
-- real gateway payments (Snippe: M-Pesa, Airtel Money, Halotel, Mixx by Yas).
-- payments.status keeps its existing pending/paid/failed enum (every
-- consumer -- admin/actions.ts, payments-panel.tsx -- hard-codes that
-- 3-value type); Snippe's voided/expired statuses collapse into "failed"
-- here, with the real upstream value preserved in gateway_status.

alter table public.payments
  add column if not exists gateway_status text,
  add column if not exists idempotency_key text;

comment on column public.payments.gateway_status is
  'Raw upstream status from the gateway (Snippe: pending/completed/failed/voided/expired). payments.status collapses this onto the existing pending/paid/failed enum.';
comment on column public.payments.idempotency_key is
  'Idempotency-Key sent to the gateway at creation, so a retried creation within the reuse window returns the same attempt instead of double-submitting.';

-- FK columns aren't auto-indexed in Postgres; both are looked up on every
-- status poll and on webhook delivery.
create index if not exists idx_payments_appointment_id on public.payments (appointment_id);
create index if not exists idx_payments_reference on public.payments (reference);

-- Parity with 0002_rls.sql's "patient can read own X" policies. Reaches
-- only signed-up patients (own_patient_id() resolves via auth.uid());
-- reference-number-only patients have no auth.uid() and every real
-- read/write in the payment flow goes through the service-role client
-- regardless, matching how appointments/pharmacy_orders already work for
-- that population.
create policy "patient can read own payments" on public.payments
  for select using (patient_id = public.own_patient_id());
