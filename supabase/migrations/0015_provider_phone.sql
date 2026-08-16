-- Doctor's real phone number, used for the post-payment "how would you like
-- to connect" screen's phone-call and WhatsApp options (src/app/consultation/
-- [appointmentId]/connect) -- those bypass LiveKit entirely and hand the
-- patient a tel:/wa.me link straight to the doctor, so this needs to be a
-- real, reachable number the doctor set themselves, not admin-entered data.
alter table public.providers
  add column if not exists phone text;
