-- Provider public profile media.
-- Doctor profile photos are public marketing/profile assets, unlike patient
-- medical attachments, so they live in a public bucket and providers store
-- the resolved public URL on their row.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'provider-profile-images',
  'provider-profile-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.providers
  add column if not exists photo_url text;
