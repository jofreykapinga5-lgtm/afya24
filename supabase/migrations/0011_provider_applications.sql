-- Public doctor applications.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'provider-applications',
  'provider-applications',
  false,
  12582912,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.provider_applications (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  license_number text,
  specialty text,
  region text,
  experience_years integer,
  languages text[] not null default '{}',
  consultation_modes text[] not null default '{}',
  bio text,
  file_path text,
  file_name text,
  file_mime_type text,
  file_size_bytes bigint,
  status text not null default 'new' check (status in ('new', 'reviewing', 'approved', 'rejected')),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_provider_applications_status_created
  on public.provider_applications (status, created_at desc);

alter table public.provider_applications enable row level security;

drop policy if exists "staff can manage provider applications" on public.provider_applications;
create policy "staff can manage provider applications" on public.provider_applications
  for all using (public.is_staff()) with check (public.is_staff());
