-- Patient intake attachments.
-- Stores images, PDFs, and voice notes in Supabase Storage while keeping
-- searchable metadata in public.files.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'patient-attachments',
  'patient-attachments',
  false,
  12582912,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'audio/webm',
    'audio/mpeg',
    'audio/mp4',
    'audio/m4a',
    'audio/x-m4a',
    'audio/wav'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.files
  add column if not exists mime_type text,
  add column if not exists size_bytes bigint,
  add column if not exists attachment_kind text
    check (attachment_kind in ('image', 'pdf', 'audio')),
  add column if not exists extracted_text text,
  add column if not exists ai_summary text;

create index if not exists idx_files_patient_created
  on public.files (patient_id, created_at desc);

create policy "patient can read own files" on public.files
  for select using (patient_id = public.own_patient_id());

create policy "doctor can read assigned patient files" on public.files
  for select using (
    public.is_admin()
    or exists (
      select 1
      from public.appointments a
      where a.patient_id = files.patient_id
        and public.is_own_provider_row(a.provider_id)
    )
  );
