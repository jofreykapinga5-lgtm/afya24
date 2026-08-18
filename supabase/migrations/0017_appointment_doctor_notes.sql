-- Free-text clinical notes a doctor writes during/after a consultation --
-- surfaced in the doctor dashboard's embedded call panel (src/app/doctor/
-- dashboard/call-panel.tsx), autosaved while they type.
alter table public.appointments
  add column if not exists doctor_notes text;
