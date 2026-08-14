-- Adds the catalog-management fields the admin pharmacy UI needs: a
-- customer-facing description, and a store-visibility status independent of
-- stock_status (a product can be in stock but not ready to publish yet, or
-- published but temporarily hidden without deleting it).

alter table public.pharmacy_items
  add column if not exists description text;

alter table public.pharmacy_items
  add column if not exists status text not null default 'published'
    check (status in ('published', 'coming_soon', 'hidden'));
