-- Adds medication_taken to patient_notifications.kind -- fired when a
-- patient marks a self-tracked medication dose as taken (see
-- api/mobile/trackers/medications/toggle-dose/route.ts), not when they
-- un-mark it. Same real-event-only discipline as the original four kinds
-- in 0024_patient_notifications.sql.
alter table public.patient_notifications drop constraint patient_notifications_kind_check;

alter table public.patient_notifications add constraint patient_notifications_kind_check
  check (
    kind in (
      'appointment_booked',
      'payment_confirmed',
      'payment_failed',
      'pharmacy_order_placed',
      'medication_taken'
    )
  );
