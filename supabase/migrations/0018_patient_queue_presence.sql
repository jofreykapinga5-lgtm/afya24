alter table public.appointments
  add column if not exists queue_joined_at timestamptz,
  add column if not exists queue_last_seen_at timestamptz;

create index if not exists idx_appointments_provider_live_queue
  on public.appointments (provider_id, scheduled_at)
  where payment_status = 'paid'
    and status in ('waiting', 'in_progress');

