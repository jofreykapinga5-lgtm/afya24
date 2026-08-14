-- Public bucket for product photos, matching the provider-profile-images
-- pattern (0010) -- created via migration, not at runtime, so "add product"
-- never has to check-then-maybe-create a bucket on the hot path. Doing that
-- at request time added slow, fragile round trips to every product save.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'pharmacy-items',
  'pharmacy-items',
  true,
  6291456,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Categories are now admin-defined free text instead of a fixed list.
-- Storefront and admin UI already just render whatever string is stored --
-- the enum was only ever blocking legitimate new categories.
alter table public.pharmacy_items
  drop constraint if exists pharmacy_items_category_check;

-- Optional merchandising badge, surfaced as a "Trending" section on the
-- storefront.
alter table public.pharmacy_items
  add column if not exists badge text
    check (badge is null or badge in ('trending', 'hot', 'new', 'sale'));
