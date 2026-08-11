-- Landing-page email capture (marketing list) -- separate from patient
-- accounts, which now use phone + password instead of email.
create table public.email_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  source text not null default 'landing_page',
  created_at timestamptz not null default now()
);

alter table public.email_subscribers enable row level security;

-- Anyone can submit their email from the public form; nobody can read the
-- list back through the API (marketing exports happen via service-role/dashboard).
create policy "anyone can subscribe" on public.email_subscribers
  for insert
  with check (true);
