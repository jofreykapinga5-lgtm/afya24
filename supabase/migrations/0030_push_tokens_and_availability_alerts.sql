-- Two pieces of real push-notification infrastructure:
-- 1) patient_push_tokens: one Expo push token per patient (the mobile app
--    registers/updates this after sign-in, see api/mobile/notifications/
--    push-token). Lets the backend push to a specific patient's phone.
-- 2) doctor_availability_subscriptions: a patient can ask to be notified
--    once a specific (currently offline) doctor comes back online -- a
--    one-shot subscription, cleared the moment it fires (see
--    lib/doctor-availability-subscriptions.ts, hooked into both
--    updateProviderAvailability and updateProviderAvailabilityByAdmin).

create table public.patient_push_tokens (
  patient_id uuid primary key references public.patients(id) on delete cascade,
  expo_push_token text not null,
  updated_at timestamptz not null default now()
);

comment on table public.patient_push_tokens is
  'One Expo push token per patient, registered by the mobile app after sign-in. Overwritten on every register call (a patient may reinstall or switch devices).';

alter table public.patient_push_tokens enable row level security;

create policy "patient can manage own push token" on public.patient_push_tokens
  for all using (patient_id = public.own_patient_id())
  with check (patient_id = public.own_patient_id());

create table public.doctor_availability_subscriptions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  provider_id uuid not null references public.providers(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (patient_id, provider_id)
);

comment on table public.doctor_availability_subscriptions is
  'A patient asking to be notified once a specific doctor is available again. One-shot: the row (and every other patient''s row for that doctor) is deleted the moment the notification fires, not left around as an ongoing subscription.';

create index idx_doctor_availability_subscriptions_provider_id
  on public.doctor_availability_subscriptions (provider_id);

alter table public.doctor_availability_subscriptions enable row level security;

create policy "patient can manage own availability subscriptions" on public.doctor_availability_subscriptions
  for all using (patient_id = public.own_patient_id())
  with check (patient_id = public.own_patient_id());
