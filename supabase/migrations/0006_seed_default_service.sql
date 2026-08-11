-- Seeds exactly one bookable service so appointments/consultation_orders
-- (both require a real services.id via a not-null FK) have something stable
-- to reference. Booking code looks this up by name via
-- src/lib/default-service.ts rather than a hardcoded UUID. Idempotent --
-- safe to paste more than once.

insert into public.service_categories (name, description, status, sort_order)
select 'General', 'General teleconsultation', 'active', 0
where not exists (select 1 from public.service_categories where name = 'General');

insert into public.services (category_id, name, description, virtual_care_allowed, base_price, status)
select c.id, 'General Teleconsultation',
  'Talk to a licensed doctor about any everyday health concern.', true, 500.00, 'active'
from public.service_categories c
where c.name = 'General'
  and not exists (select 1 from public.services where name = 'General Teleconsultation');
