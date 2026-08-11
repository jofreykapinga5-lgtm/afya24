-- Afya24 core schema.
-- Mirrors DATA-MODEL.md. Enum-like columns use CHECK constraints with the same
-- value sets as the corresponding TypeScript unions in frontend/src/lib/types.ts,
-- so the DB and the frontend never drift silently.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Staff / provider accounts (backed by Supabase Auth). Patients do NOT get a
-- row here in v1 -- they're identified by hospital_reference_number instead.
-- ---------------------------------------------------------------------------
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique not null,
  phone text,
  role text not null check (role in ('admin', 'doctor', 'pharmacy_staff', 'lab_staff')),
  status text not null default 'invited' check (status in ('active', 'suspended', 'invited')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  -- References auth.users directly, NOT public.users -- public.users is the
  -- staff/provider table. A patient who signs up gets a real Supabase Auth
  -- account but never a public.users row. Patients who only ever use
  -- reference-number lookup (no signup) have this as null.
  user_id uuid unique references auth.users (id) on delete set null,
  hospital_reference_number text unique not null,
  full_name text not null,
  date_of_birth date,
  gender text check (gender in ('female', 'male', 'other')),
  phone text,
  emergency_contact text,
  address text,
  blood_group text,
  insurance_number text,
  national_id_reference text,
  preferred_language text not null default 'en' check (preferred_language in ('en', 'sw')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.patient_medical_files (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  summary text,
  privacy_status text not null default 'private' check (privacy_status in ('private', 'restricted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.patient_allergies (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  allergy_name text not null,
  reaction text,
  severity text check (severity in ('mild', 'moderate', 'severe')),
  recorded_by_user_id uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.patient_conditions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  condition_name text not null,
  status text not null default 'active' check (status in ('active', 'resolved', 'chronic')),
  diagnosed_at date,
  recorded_by_user_id uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.patient_medications (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  medication_name text not null,
  dosage text,
  frequency text,
  status text not null default 'active' check (status in ('active', 'discontinued')),
  recorded_by_user_id uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Providers, services, pricing, availability
-- ---------------------------------------------------------------------------
create table public.providers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  full_name text not null,
  specialty text not null,
  license_number text,
  credentials text,
  signature_file_id uuid,
  bio text,
  profile_status text not null default 'pending' check (profile_status in ('pending', 'active', 'suspended')),
  rating_summary jsonb not null default '{"rating": 0, "reviewCount": 0}'::jsonb,
  languages text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.service_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.service_categories (id) on delete restrict,
  name text not null,
  description text,
  virtual_care_allowed boolean not null default true,
  emergency_exclusion_text text,
  in_person_required_text text,
  base_price numeric(10, 2) not null,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.provider_services (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id) on delete cascade,
  service_id uuid not null references public.services (id) on delete cascade,
  price numeric(10, 2) not null,
  duration_minutes integer not null default 30,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider_id, service_id)
);

create table public.provider_availability_slots (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'open' check (status in ('open', 'held', 'booked', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

-- ---------------------------------------------------------------------------
-- Booking, consultation orders, video sessions
-- ---------------------------------------------------------------------------
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  provider_id uuid not null references public.providers (id) on delete restrict,
  service_id uuid not null references public.services (id) on delete restrict,
  availability_slot_id uuid references public.provider_availability_slots (id) on delete set null,
  scheduled_at timestamptz not null,
  status text not null default 'scheduled' check (
    status in ('scheduled', 'waiting', 'in_progress', 'completed', 'cancelled')
  ),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed')),
  price numeric(10, 2) not null,
  currency text not null default 'TZS',
  video_session_id uuid,
  active_session_token text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.patient_lookup_events (
  id uuid primary key default gen_random_uuid(),
  -- Nullable: failed lookup attempts (wrong reference number / DOB) are still
  -- logged for brute-force auditing, and have no real patient to attach to.
  patient_id uuid references public.patients (id) on delete cascade,
  lookup_method text not null,
  searched_value_hash text not null,
  matched_by_user_id uuid references public.users (id) on delete set null,
  appointment_id uuid references public.appointments (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.consultation_orders (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  provider_id uuid not null references public.providers (id) on delete restrict,
  service_id uuid not null references public.services (id) on delete restrict,
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  consultation_mode text not null check (consultation_mode in ('chat', 'voice', 'video')),
  subtotal numeric(10, 2) not null,
  fees numeric(10, 2) not null default 0,
  total numeric(10, 2) not null,
  currency text not null default 'TZS',
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Video sessions are provider-agnostic: room_provider/room_name/room_url hold
-- whatever a managed video SDK (e.g. Daily.co) returns. See src/lib/video/.
create table public.video_sessions (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null unique references public.appointments (id) on delete cascade,
  provider_id uuid not null references public.providers (id) on delete cascade,
  patient_id uuid not null references public.patients (id) on delete cascade,
  status text not null default 'not_started' check (
    status in ('not_started', 'connecting', 'active', 'ended')
  ),
  room_provider text not null default 'daily',
  room_name text,
  join_url text,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.appointments
  add constraint appointments_video_session_id_fkey
  foreign key (video_session_id) references public.video_sessions (id) on delete set null;

-- ---------------------------------------------------------------------------
-- AI intake, summaries, related cases
-- ---------------------------------------------------------------------------
create table public.symptom_intakes (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  language text not null check (language in ('en', 'sw')),
  raw_patient_explanation text not null,
  chief_complaint text,
  symptoms text[] not null default '{}',
  duration text,
  medications text[] not null default '{}',
  allergies text[] not null default '{}',
  existing_conditions text[] not null default '{}',
  emergency_warning_acknowledged boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.ai_summaries (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  source_language text not null check (source_language in ('en', 'sw')),
  output_language text not null check (output_language in ('en', 'sw')),
  summary_text text not null,
  structured_summary_json jsonb,
  suggested_follow_up_questions text[] not null default '{}',
  urgency_level text not null check (urgency_level in ('low', 'moderate', 'high', 'emergency')),
  safety_flags text[] not null default '{}',
  model_name text not null,
  reviewed_by_doctor boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Consultations, prescriptions, visit documents, referrals
-- ---------------------------------------------------------------------------
create table public.consultations (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  started_at timestamptz,
  ended_at timestamptz,
  doctor_notes text,
  outcome text,
  follow_up_required boolean not null default false,
  signed_by_doctor_id uuid references public.users (id) on delete set null,
  signed_at timestamptz,
  -- FK to visit_documents added below once that table exists (circular reference).
  visit_summary_document_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.related_case_matches (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  matched_consultation_id uuid not null references public.consultations (id) on delete cascade,
  match_reason text,
  similarity_score numeric(4, 3),
  anonymized_snapshot_json jsonb not null,
  viewed_by_doctor_id uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  consultation_id uuid not null references public.consultations (id) on delete cascade,
  patient_id uuid not null references public.patients (id) on delete cascade,
  doctor_id uuid not null references public.users (id) on delete restrict,
  medication_name text not null,
  dosage text not null,
  instructions text not null,
  duration text,
  status text not null default 'draft' check (status in ('draft', 'signed', 'fulfilled', 'cancelled')),
  signed_by_doctor_id uuid references public.users (id) on delete set null,
  signed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.visit_documents (
  id uuid primary key default gen_random_uuid(),
  consultation_id uuid not null references public.consultations (id) on delete cascade,
  patient_id uuid not null references public.patients (id) on delete cascade,
  doctor_id uuid not null references public.users (id) on delete restrict,
  document_type text not null check (
    document_type in ('visit_summary', 'prescription', 'referral', 'lab_order')
  ),
  file_id uuid,
  signature_file_id uuid,
  status text not null default 'draft' check (status in ('draft', 'final')),
  generated_at timestamptz not null default now(),
  accessed_by_patient_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.consultations
  add constraint consultations_visit_summary_document_id_fkey
  foreign key (visit_summary_document_id) references public.visit_documents (id) on delete set null;

create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  consultation_id uuid not null references public.consultations (id) on delete cascade,
  patient_id uuid not null references public.patients (id) on delete cascade,
  doctor_id uuid not null references public.users (id) on delete restrict,
  referral_reason text not null,
  referred_to text not null,
  notes text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Labs
-- ---------------------------------------------------------------------------
create table public.lab_locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  phone text,
  region text,
  latitude double precision not null,
  longitude double precision not null,
  map_url text,
  whatsapp_location_text text,
  opening_hours text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lab_tests (
  id uuid primary key default gen_random_uuid(),
  test_name text not null,
  description text,
  estimated_price numeric(10, 2),
  sample_type text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lab_orders (
  id uuid primary key default gen_random_uuid(),
  consultation_id uuid not null references public.consultations (id) on delete cascade,
  patient_id uuid not null references public.patients (id) on delete cascade,
  doctor_id uuid not null references public.users (id) on delete restrict,
  lab_location_id uuid not null references public.lab_locations (id) on delete restrict,
  status text not null default 'ordered' check (
    status in ('ordered', 'instructions_sent', 'sample_collected', 'results_pending', 'results_ready')
  ),
  reason text,
  instructions text,
  map_url text,
  whatsapp_delivery_status text not null default 'not_sent' check (
    whatsapp_delivery_status in ('not_sent', 'sent', 'delivered', 'failed')
  ),
  whatsapp_sent_at timestamptz,
  whatsapp_message_id text,
  result_file_id uuid,
  result_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lab_order_tests (
  id uuid primary key default gen_random_uuid(),
  lab_order_id uuid not null references public.lab_orders (id) on delete cascade,
  lab_test_id uuid not null references public.lab_tests (id) on delete restrict,
  status text not null default 'pending' check (status in ('pending', 'collected', 'resulted')),
  result_value text,
  result_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Pharmacy
-- ---------------------------------------------------------------------------
create table public.pharmacy_items (
  id uuid primary key default gen_random_uuid(),
  medicine_name text not null,
  category text not null check (
    category in (
      'Pain relief', 'Allergy', 'Antibiotics', 'Vitamins & supplements',
      'First aid', 'Cold & flu', 'Chronic condition'
    )
  ),
  form text,
  strength text,
  stock_status text not null default 'in_stock' check (
    stock_status in ('in_stock', 'low_stock', 'out_of_stock')
  ),
  unit_price numeric(10, 2) not null,
  requires_prescription boolean not null default false,
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pharmacy_orders (
  id uuid primary key default gen_random_uuid(),
  prescription_id uuid references public.prescriptions (id) on delete set null,
  patient_id uuid not null references public.patients (id) on delete cascade,
  pharmacist_user_id uuid references public.users (id) on delete set null,
  status text not null default 'pending' check (
    status in ('pending', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'completed')
  ),
  fulfillment_method text not null check (fulfillment_method in ('pickup', 'delivery')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed')),
  total_amount numeric(10, 2) not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pharmacy_order_items (
  id uuid primary key default gen_random_uuid(),
  pharmacy_order_id uuid not null references public.pharmacy_orders (id) on delete cascade,
  pharmacy_item_id uuid not null references public.pharmacy_items (id) on delete restrict,
  prescribed_medication_name text,
  quantity integer not null default 1 check (quantity > 0),
  availability_status text not null default 'in_stock' check (
    availability_status in ('in_stock', 'low_stock', 'out_of_stock')
  ),
  substitution_requested boolean not null default false,
  doctor_approval_required boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Files, payments, messages, audit log
-- ---------------------------------------------------------------------------
create table public.files (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.patients (id) on delete cascade,
  appointment_id uuid references public.appointments (id) on delete set null,
  medical_file_id uuid references public.patient_medical_files (id) on delete set null,
  uploaded_by_user_id uuid references public.users (id) on delete set null,
  file_type text not null,
  storage_path text not null,
  original_filename text,
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  patient_id uuid not null references public.patients (id) on delete cascade,
  amount numeric(10, 2) not null,
  currency text not null default 'TZS',
  method text,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  reference text,
  confirmed_by_admin_id uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  sender_user_id uuid references public.users (id) on delete set null,
  message_text text not null,
  message_type text not null default 'text' check (message_type in ('text', 'system')),
  language text check (language in ('en', 'sw')),
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.users (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata_json jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes for the lookups the app actually does
-- ---------------------------------------------------------------------------
create index idx_patients_reference on public.patients (hospital_reference_number);
create index idx_appointments_patient on public.appointments (patient_id);
create index idx_appointments_provider on public.appointments (provider_id);
create index idx_provider_availability_provider on public.provider_availability_slots (provider_id, starts_at);
create index idx_prescriptions_patient on public.prescriptions (patient_id);
create index idx_pharmacy_orders_patient on public.pharmacy_orders (patient_id);
create index idx_lab_orders_patient on public.lab_orders (patient_id);
create index idx_messages_appointment on public.messages (appointment_id, created_at);
create index idx_audit_logs_entity on public.audit_logs (entity_type, entity_id);

-- updated_at auto-touch trigger, applied to every table that has the column.
create function public.set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare
  t text;
begin
  for t in
    select table_name from information_schema.columns
    where table_schema = 'public' and column_name = 'updated_at'
  loop
    execute format(
      'create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      t
    );
  end loop;
end;
$$;
