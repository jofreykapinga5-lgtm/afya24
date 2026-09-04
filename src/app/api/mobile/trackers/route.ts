import { NextResponse } from "next/server";
import { getPatientSession } from "@/lib/patient-session";
import { createServiceClient } from "@/lib/supabase/service";

// One combined read for everything the mobile app's Medications/Dashboard
// screens need -- medications and their taken-doses -- mirroring how
// getCachedHomepageData bundles several related reads into one response on
// the web side. Same reasoning as every other mobile route: a service-role
// client with an explicit patient_id filter, not RLS, since this is a
// custom-JWT session, not a Supabase Auth one.
export async function GET() {
  const session = await getPatientSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Your session expired. Please sign in again." }, { status: 401 });
  }

  const service = createServiceClient();
  const medsResult = await service
    .from("patient_self_medications")
    .select("id, name, dose, frequency, times, course_days, started_on, ended_on")
    .eq("patient_id", session.patientId)
    .order("created_at", { ascending: true });

  const medicationIds = (medsResult.data ?? []).map((m) => m.id as string);
  const dosesResult = medicationIds.length
    ? await service.from("patient_self_medication_doses").select("medication_id, taken_on").in("medication_id", medicationIds)
    : { data: [] };

  return NextResponse.json({
    ok: true,
    medications: (medsResult.data ?? []).map((m) => ({
      id: m.id,
      name: m.name,
      dose: m.dose,
      frequency: m.frequency,
      times: m.times,
      courseDays: m.course_days,
      startedOn: m.started_on,
      endedOn: m.ended_on,
    })),
    doses: (dosesResult.data ?? []).map((d) => ({ medicationId: d.medication_id, takenOn: d.taken_on })),
  });
}
