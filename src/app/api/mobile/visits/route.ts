import { NextResponse } from "next/server";
import { getPatientSession } from "@/lib/patient-session";
import { createServiceClient } from "@/lib/supabase/service";

type DbAppointment = {
  id: string;
  scheduled_at: string;
  status: string;
  price: number | string;
  currency: string;
  payment_status: string;
  providers: { full_name: string; specialty: string; photo_url: string | null } | null;
  consultation_orders: { consultation_mode: string }[] | null;
};

// Mobile equivalent of the web patient dashboard's /account/dashboard/history
// page -- same fields, same appointments query, nothing fabricated. The
// mobile Visits tab used to render a fully mock array (VISITS in
// constants.ts) with an invented "doctor report / medicines / follow-up"
// per visit -- that content has no real backing table (patient_medications
// has no appointment_id at all, and appointments.doctor_notes is never
// surfaced to patients even on the web dashboard, which shows an
// unconditionally-empty "Care summary" card), so this deliberately returns
// only what's real: the same appointment metadata web already shows,
// plus price/paymentStatus (real, appointments/payments columns) for a
// still-useful expand view without inventing clinical content.
export async function GET() {
  const session = await getPatientSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Your session expired. Please sign in again." }, { status: 401 });
  }

  const service = createServiceClient();
  const { data, error } = await service
    .from("appointments")
    .select(
      "id, scheduled_at, status, price, currency, payment_status, providers(full_name, specialty, photo_url), consultation_orders(consultation_mode)"
    )
    .eq("patient_id", session.patientId)
    .order("scheduled_at", { ascending: false })
    .returns<DbAppointment[]>();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const visits = (data ?? []).map((appointment) => ({
    id: appointment.id,
    scheduledAt: appointment.scheduled_at,
    status: appointment.status,
    specialty: appointment.providers?.specialty ?? null,
    doctorName: appointment.providers?.full_name ?? null,
    doctorPhotoUrl: appointment.providers?.photo_url ?? null,
    mode: appointment.consultation_orders?.[0]?.consultation_mode ?? "video",
    price: Number(appointment.price),
    currency: appointment.currency,
    paymentStatus: appointment.payment_status,
  }));

  return NextResponse.json({ ok: true, visits, totalVisits: visits.length });
}
