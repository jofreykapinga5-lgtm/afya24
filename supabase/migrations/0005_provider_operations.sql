-- Provider operations: admin-created provider access, doctor availability,
-- and updated pharmacy categories for the broader e-pharmacy catalog.

alter table public.providers
  add column if not exists available_now boolean not null default false,
  add column if not exists availability_note text,
  add column if not exists consultation_modes text[] not null default '{chat,voice,video}';

alter table public.providers
  add constraint providers_consultation_modes_allowed
  check (consultation_modes <@ array['chat', 'voice', 'video']::text[]);

alter table public.provider_availability_slots
  add column if not exists slot_type text not null default 'available',
  add column if not exists consultation_modes text[] not null default '{chat,voice,video}',
  add column if not exists note text;

alter table public.provider_availability_slots
  add constraint provider_availability_slots_type_allowed
  check (slot_type in ('available', 'break', 'time_off'));

alter table public.provider_availability_slots
  add constraint provider_availability_slots_modes_allowed
  check (consultation_modes <@ array['chat', 'voice', 'video']::text[]);

alter table public.pharmacy_items
  drop constraint if exists pharmacy_items_category_check;

alter table public.pharmacy_items
  add constraint pharmacy_items_category_check
  check (
    category in (
      'Pain relief',
      'Allergy',
      'Antibiotics',
      'Vitamins & supplements',
      'Supplements',
      'Hospital tools',
      'Medical devices',
      'Wound care',
      'First aid',
      'Cold & flu',
      'Chronic condition'
    )
  );

drop policy if exists "public can read open slots" on public.provider_availability_slots;
create policy "public can read open slots" on public.provider_availability_slots
  for select using (status = 'open' and slot_type = 'available');
