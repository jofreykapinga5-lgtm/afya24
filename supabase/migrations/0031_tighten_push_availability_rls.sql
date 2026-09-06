-- 0030 gave patient_push_tokens and doctor_availability_subscriptions a
-- "for all" (select/insert/update/delete) policy each. Every other
-- patient-scoped table in this schema (patient_notifications,
-- patient_self_medications/patient_care_plans/patient_readings,
-- consultation_feedback, payments, files) grants only a read-only
-- "for select" policy, since every write to any of these tables already
-- goes through the service-role client (which bypasses RLS entirely) --
-- there is no code path today where a patient's own Supabase session
-- writes to either table directly. "for all" was a real, if not currently
-- exploitable, widening of that convention: it grants a patient's own
-- session direct INSERT/UPDATE/DELETE this schema otherwise never hands
-- out. Tightened here to match every sibling table instead.

drop policy "patient can manage own push token" on public.patient_push_tokens;

create policy "patient can read own push token" on public.patient_push_tokens
  for select using (patient_id = public.own_patient_id());

drop policy "patient can manage own availability subscriptions" on public.doctor_availability_subscriptions;

create policy "patient can read own availability subscriptions" on public.doctor_availability_subscriptions
  for select using (patient_id = public.own_patient_id());
