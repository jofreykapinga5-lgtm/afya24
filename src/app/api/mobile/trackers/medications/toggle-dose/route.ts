import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getPatientSession } from "@/lib/patient-session";
import { createServiceClient } from "@/lib/supabase/service";
import { createPatientNotification } from "@/lib/patient-notifications";

export async function POST(request: NextRequest) {
  const session = await getPatientSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Your session expired. Please sign in again." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const medicationId = typeof body?.medicationId === "string" ? body.medicationId : "";
  const dateKey = typeof body?.dateKey === "string" ? body.dateKey : "";
  if (!medicationId || !dateKey) {
    return NextResponse.json({ ok: false, error: "Missing medicationId or dateKey." }, { status: 400 });
  }

  const service = createServiceClient();
  const { data: owned } = await service
    .from("patient_self_medications")
    .select("id, name, dose")
    .eq("id", medicationId)
    .eq("patient_id", session.patientId)
    .maybeSingle();
  if (!owned) {
    return NextResponse.json({ ok: false, error: "Not authorized for this medication." }, { status: 403 });
  }

  const { data: existing } = await service
    .from("patient_self_medication_doses")
    .select("id")
    .eq("medication_id", medicationId)
    .eq("taken_on", dateKey)
    .maybeSingle();

  if (existing) {
    const { error } = await service.from("patient_self_medication_doses").delete().eq("id", existing.id);
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, taken: false });
  }

  const { error } = await service
    .from("patient_self_medication_doses")
    .insert({ medication_id: medicationId, taken_on: dateKey, taken_at: new Date().toISOString() });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  // Only on the "marked taken" branch -- un-marking a dose isn't a new
  // event worth a notification, just undoing the last one.
  await createPatientNotification(service, session.patientId, "medication_taken", {
    medicationName: owned.name,
    dose: owned.dose,
  });

  return NextResponse.json({ ok: true, taken: true });
}
