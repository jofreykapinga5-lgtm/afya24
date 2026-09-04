-- Real notification events for a patient (appointment booked, payment
-- confirmed/failed, pharmacy order placed). The mobile Notifications screen
-- previously rendered a fixed mock array with invented titles/timestamps --
-- this is what it now reads from.
--
-- kind selects a client-side i18n template (see mobile/src/constants.ts's
-- notification copy); data holds only the fields that template needs
-- (doctor name, amount, order id, ...), never pre-rendered text -- title/
-- body stay bilingual this way, same reasoning as patient_care_plans.profile
-- in 0021_patient_trackers.sql being jsonb rather than fixed text columns.
--
-- Written by the one shared server helper in lib/patient-notifications.ts,
-- called from the handful of places these events actually happen
-- (bookConsultationForPatient, applySnippePaymentResult,
-- placePharmacyOrder) -- not a general-purpose event log every action
-- writes to.
create table public.patient_notifications (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  kind text not null check (
    kind in (
      'appointment_booked',
      'payment_confirmed',
      'payment_failed',
      'pharmacy_order_placed'
    )
  ),
  data jsonb not null default '{}'::jsonb,
  -- Null = unread. Set, not deleted, when read -- same convention as
  -- patient_self_medications.ended_on: a read notification still has
  -- history worth keeping instead of disappearing.
  read_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.patient_notifications is
  'Real notification events for a patient. kind selects a client-side i18n template; data holds the fields that template needs. See lib/patient-notifications.ts for the one shared write path.';

create index idx_patient_notifications_patient_id on public.patient_notifications (patient_id, created_at desc);

alter table public.patient_notifications enable row level security;

create policy "patient can read own notifications" on public.patient_notifications
  for select using (patient_id = public.own_patient_id());
