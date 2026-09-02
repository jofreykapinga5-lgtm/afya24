-- Patient self-tracking features (medications, chronic-care readings, cycle
-- tracking) built first for the native mobile app, previously stored only
-- on-device in AsyncStorage. Moved server-side so a patient's data survives
-- a new phone and, per an explicit product decision, so any active doctor
-- can see it during a consultation -- the same "shared clinic chart, not
-- scoped to doctors who've treated this patient before" model already used
-- for AI intake summaries and doctor notes (see api/doctor/patient-history).
--
-- Named patient_self_medications, not patient_medications -- that name is
-- already taken by a separate, doctor-recorded medications table
-- (medication_name/dosage/status/recorded_by_user_id) that's part of a
-- different, pre-existing patient-file schema (alongside patient_conditions,
-- patient_allergies, patient_medical_files, prescriptions) that nothing in
-- the web app currently reads or writes. That table is a clinician's record
-- of what a patient is on; this one is the patient's own self-reported
-- reminder list from the app. Deliberately kept separate rather than
-- unified, since merging them is a real product decision, not a naming fix.
--
-- Doctor reads are NOT granted here via RLS -- consistent with how every
-- other doctor-facing read in this schema works (api/doctor/patient-history,
-- api/doctor/video-queue): a service-role-backed API route with an
-- application-level active-doctor check, not a policy. Only the patient's
-- own read access is granted via RLS, for parity with every other
-- patient-linked table (payments, consultation_feedback), even though real
-- reads/writes go through the service-role client regardless (most patients
-- here have no auth.uid() at all -- see own_patient_id()'s own comment).

create table public.patient_self_medications (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  name text not null,
  dose text not null,
  frequency text not null check (frequency in ('once', 'twice', 'thrice', 'four', 'asNeeded')),
  -- Scheduled clock times, e.g. '08:00' -- drives each device's own local
  -- reminder scheduling. The Expo-notification IDs that scheduling produces
  -- are device-local artifacts, not clinical data, and deliberately aren't
  -- stored here.
  times text[] not null default '{}',
  course_days integer,
  started_on date not null default current_date,
  -- Null while ongoing; set when the patient removes/completes the course.
  -- Kept (not deleted) so the dose history below still has something to
  -- point at.
  ended_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.patient_self_medications is
  'A patient''s self-reported medication list from the app (name, dose, schedule) -- not the doctor-recorded patient_medications table.';

create table public.patient_self_medication_doses (
  id uuid primary key default gen_random_uuid(),
  medication_id uuid not null references public.patient_self_medications(id) on delete cascade,
  taken_on date not null,
  taken_at timestamptz not null default now(),
  -- One toggle per medication per day, matching the app's existing taken-log
  -- shape (a flat day -> medication-ids map), not per scheduled time slot.
  unique (medication_id, taken_on)
);

comment on table public.patient_self_medication_doses is
  'One row per day a patient marked a self-tracked medication as taken. Deleting the row is how "un-taking" it is represented.';

create table public.patient_care_plans (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  condition text not null check (condition in ('diabetes', 'hypertension', 'cycle')),
  unit text not null,
  enrolled_on date not null default current_date,
  -- Flexible per-condition settings (e.g. target range, average cycle
  -- length, the id of the last-scheduled "period coming soon" local
  -- reminder) -- jsonb rather than a column per condition since each
  -- condition's profile shape genuinely differs.
  profile jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (patient_id, condition)
);

comment on table public.patient_care_plans is
  'One row per condition a patient has enrolled in self-tracking. profile holds condition-specific settings, not readings -- see patient_readings. Distinct from patient_conditions, which is a doctor-diagnosed condition record.';

create table public.patient_readings (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  condition text not null check (condition in ('diabetes', 'hypertension', 'cycle')),
  value numeric not null,
  -- Diastolic, for hypertension readings only; unused otherwise.
  value2 numeric,
  -- 'fasting'/'afterMeal' (diabetes), 'period'/other symptom tags (cycle),
  -- free-form otherwise.
  tag text not null default '',
  context text[] not null default '{}',
  note text,
  recorded_at timestamptz not null default now()
);

comment on table public.patient_readings is
  'Logged readings across all self-tracked conditions -- glucose, blood pressure, or a cycle-tracking entry, disambiguated by condition/tag. Deliberately not one-per-day: diabetes and hypertension can log multiple readings a day; cycle entries staying one-per-day is enforced by the app, not this table.';

-- FK columns aren't auto-indexed in Postgres.
create index idx_patient_self_medications_patient_id on public.patient_self_medications (patient_id);
create index idx_patient_self_medication_doses_medication_id on public.patient_self_medication_doses (medication_id);
create index idx_patient_care_plans_patient_id on public.patient_care_plans (patient_id);
create index idx_patient_readings_patient_id on public.patient_readings (patient_id);
create index idx_patient_readings_condition on public.patient_readings (patient_id, condition, recorded_at desc);

create trigger set_updated_at before update on public.patient_self_medications
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.patient_care_plans
  for each row execute function public.set_updated_at();

alter table public.patient_self_medications enable row level security;
alter table public.patient_self_medication_doses enable row level security;
alter table public.patient_care_plans enable row level security;
alter table public.patient_readings enable row level security;

create policy "patient can read own self-tracked medications" on public.patient_self_medications
  for select using (patient_id = public.own_patient_id());

create policy "patient can read own medication doses" on public.patient_self_medication_doses
  for select using (
    medication_id in (
      select id from public.patient_self_medications where patient_id = public.own_patient_id()
    )
  );

create policy "patient can read own care plans" on public.patient_care_plans
  for select using (patient_id = public.own_patient_id());

create policy "patient can read own readings" on public.patient_readings
  for select using (patient_id = public.own_patient_id());
