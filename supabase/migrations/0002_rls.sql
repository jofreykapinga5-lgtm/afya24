-- Row Level Security.
--
-- Two different kinds of patient identity coexist:
-- 1. Signed-up patients: a real Supabase Auth account, auth.uid() maps to
--    patients.user_id. RLS policies below can key off auth.uid() directly.
-- 2. Reference-number-only patients: no Supabase Auth account at all (the
--    original v1 model -- DATA-MODEL.md: "Patients do not need full accounts
--    in v1"). There is no auth.uid() for these, so their data access goes
--    through Next.js server-side route handlers using the service-role key
--    (see src/lib/supabase/service.ts), which enforces the reference-number +
--    date-of-birth check in application code. Never expose that key to the
--    browser.
--
-- Staff/provider/admin accounts are also real Supabase Auth users, but map
-- to public.users (not patients) -- see current_role_name() below.

create or replace function public.current_role_name()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid();
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
as $$
  select public.current_role_name() is not null;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select public.current_role_name() = 'admin';
$$;

create or replace function public.is_own_provider_row(target_provider_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.providers
    where id = target_provider_id and user_id = auth.uid()
  );
$$;

create or replace function public.own_patient_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.patients where user_id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- Publicly browsable catalog data: anyone (including anon/unauthenticated
-- visitors) can read active rows. This mirrors what the current frontend
-- shows on the public marketplace before any login/lookup happens.
-- ---------------------------------------------------------------------------
alter table public.service_categories enable row level security;
create policy "public can read active service categories" on public.service_categories
  for select using (status = 'active');

alter table public.services enable row level security;
create policy "public can read active services" on public.services
  for select using (status = 'active');

alter table public.providers enable row level security;
create policy "public can read active providers" on public.providers
  for select using (profile_status = 'active');
create policy "provider can update own profile" on public.providers
  for update using (user_id = auth.uid());
create policy "staff can manage providers" on public.providers
  for all using (public.is_admin()) with check (public.is_admin());

alter table public.provider_services enable row level security;
create policy "public can read active provider services" on public.provider_services
  for select using (status = 'active');

alter table public.provider_availability_slots enable row level security;
create policy "public can read open slots" on public.provider_availability_slots
  for select using (status = 'open');
create policy "provider manages own slots" on public.provider_availability_slots
  for all using (public.is_own_provider_row(provider_id)) with check (public.is_own_provider_row(provider_id));

alter table public.pharmacy_items enable row level security;
create policy "public can read pharmacy catalog" on public.pharmacy_items
  for select using (true);
create policy "staff can manage pharmacy catalog" on public.pharmacy_items
  for all using (public.current_role_name() in ('admin', 'pharmacy_staff'))
  with check (public.current_role_name() in ('admin', 'pharmacy_staff'));

alter table public.lab_locations enable row level security;
create policy "public can read active lab locations" on public.lab_locations
  for select using (status = 'active');

alter table public.lab_tests enable row level security;
create policy "public can read active lab tests" on public.lab_tests
  for select using (status = 'active');

-- ---------------------------------------------------------------------------
-- Staff accounts table: staff can read their own row; admins can read/manage all.
-- ---------------------------------------------------------------------------
alter table public.users enable row level security;
create policy "staff can read own row" on public.users
  for select using (id = auth.uid());
create policy "admin can manage staff" on public.users
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Patient-identifiable tables. Default is service-role-only (see header
-- comment). A signed-up patient additionally gets narrow self-access via the
-- policies below, keyed off own_patient_id(). Reference-number-only patients
-- still go through server-side route handlers -- they have no auth.uid().
-- Extend deliberately, table by table; do not add a blanket "authenticated"
-- policy without re-deriving the per-role access rules from DATA-MODEL.md's
-- "Data Rules" section first.
-- ---------------------------------------------------------------------------
alter table public.patients enable row level security;
alter table public.patient_medical_files enable row level security;
alter table public.patient_allergies enable row level security;
alter table public.patient_conditions enable row level security;
alter table public.patient_medications enable row level security;
alter table public.patient_lookup_events enable row level security;
alter table public.appointments enable row level security;
alter table public.consultation_orders enable row level security;
alter table public.video_sessions enable row level security;
alter table public.symptom_intakes enable row level security;
alter table public.ai_summaries enable row level security;
alter table public.consultations enable row level security;
alter table public.related_case_matches enable row level security;
alter table public.prescriptions enable row level security;
alter table public.visit_documents enable row level security;
alter table public.referrals enable row level security;
alter table public.lab_orders enable row level security;
alter table public.lab_order_tests enable row level security;
alter table public.pharmacy_orders enable row level security;
alter table public.pharmacy_order_items enable row level security;
alter table public.files enable row level security;
alter table public.payments enable row level security;
alter table public.messages enable row level security;
alter table public.audit_logs enable row level security;

-- Doctors need to see their own assigned appointments/consultations directly
-- (dashboard reads are frequent enough that funnelling every read through a
-- route handler would be wasteful). Everything else on this list stays
-- service-role-only for now -- extend deliberately, table by table.
create policy "doctor can read own appointments" on public.appointments
  for select using (public.is_own_provider_row(provider_id) or public.is_admin());
create policy "doctor can update own appointments" on public.appointments
  for update using (public.is_own_provider_row(provider_id) or public.is_admin());

create policy "doctor can read own consultations" on public.consultations
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.appointments a
      where a.id = consultations.appointment_id and public.is_own_provider_row(a.provider_id)
    )
  );
create policy "doctor can manage own consultations" on public.consultations
  for all using (
    public.is_admin()
    or exists (
      select 1 from public.appointments a
      where a.id = consultations.appointment_id and public.is_own_provider_row(a.provider_id)
    )
  );

-- ---------------------------------------------------------------------------
-- Signed-up patient self-access. Read-only except for their own patients row
-- (contact details) -- appointments, prescriptions, etc. are written by
-- staff/route handlers, never directly by the patient.
-- ---------------------------------------------------------------------------
create policy "patient can read own row" on public.patients
  for select using (user_id = auth.uid());
create policy "patient can update own contact details" on public.patients
  for update using (user_id = auth.uid());

create policy "patient can read own appointments" on public.appointments
  for select using (patient_id = public.own_patient_id());

create policy "patient can read own prescriptions" on public.prescriptions
  for select using (patient_id = public.own_patient_id());

create policy "patient can read own lab orders" on public.lab_orders
  for select using (patient_id = public.own_patient_id());

create policy "patient can read own pharmacy orders" on public.pharmacy_orders
  for select using (patient_id = public.own_patient_id());

create policy "patient can read own visit documents" on public.visit_documents
  for select using (patient_id = public.own_patient_id());
