-- Patient-submitted post-consultation rating/feedback/testimonial, collected
-- right after a call ends (before the optional account-upgrade offer) and
-- reviewed by admin on a new dashboard page. Two free-text fields on
-- purpose: feedback_text is private quality feedback for admin/doctor
-- review; testimonial_text is a separate opt-in quote the patient has
-- explicitly agreed (testimonial_consent) could be featured publicly --
-- nothing here changes what's shown on doctor cards or the public site
-- automatically, matching the existing admin-curated providers.rating_summary
-- (admin reviews real submissions here, then decides whether/how to reflect
-- them elsewhere).

create table public.consultation_feedback (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null unique references public.appointments(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  provider_id uuid not null references public.providers(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  feedback_text text,
  testimonial_text text,
  testimonial_consent boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.consultation_feedback is
  'One row per appointment: patient star rating + optional private feedback + optional public-testimonial quote (only usable publicly if testimonial_consent is true). Purely informational for admin today -- does not feed providers.rating_summary automatically.';

-- FK columns aren't auto-indexed in Postgres; provider_id is filtered by the
-- admin feedback page, created_at drives its default newest-first order.
create index idx_consultation_feedback_provider_id on public.consultation_feedback (provider_id);
create index idx_consultation_feedback_created_at on public.consultation_feedback (created_at desc);

alter table public.consultation_feedback enable row level security;

-- Parity with 0019's payments policy -- reaches only signed-up patients
-- (own_patient_id() resolves via auth.uid()); reference-number-only patients
-- have no auth.uid() and every real read/write here goes through the
-- service-role client regardless, matching every other patient-linked table.
create policy "patient can read own feedback" on public.consultation_feedback
  for select using (patient_id = public.own_patient_id());
