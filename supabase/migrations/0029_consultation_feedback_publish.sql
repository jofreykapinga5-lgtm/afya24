-- Adds the admin-approval gate that 0020's own comment promised but never
-- built: a patient opting a testimonial into "public" (testimonial_consent)
-- was never enough on its own to show it anywhere -- an admin must also
-- explicitly publish it. Only rows with both flags true are meant to ever
-- be read by a public/unauthenticated endpoint (the doctor-profile reviews
-- the mobile app and web site show).

alter table public.consultation_feedback
  add column is_published boolean not null default false;

comment on column public.consultation_feedback.is_published is
  'Admin-approved for public display (doctor profile reviews). Only ever true alongside testimonial_consent = true -- a patient consenting to "public" is not itself publication, an admin must also approve it here.';

-- Public doctor-profile review reads filter on both flags together.
create index idx_consultation_feedback_published
  on public.consultation_feedback (provider_id, is_published)
  where is_published = true;
