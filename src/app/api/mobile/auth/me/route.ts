import { NextResponse } from "next/server";
import { getPatientSession } from "@/lib/patient-session";
import { createServiceClient } from "@/lib/supabase/service";
import { toApiPatient } from "@/lib/mobile-patient";

// The stored session JWT only encodes { patientId } (see
// signPatientSessionToken in lib/patient-session.ts) -- it doesn't carry a
// display name/phone, so the mobile app can't just decode the token it saved
// on launch and know who's signed in. This is what it calls instead: verify
// the Bearer token, look up the real patient record, return the same
// ApiPatient shape every other mobile auth endpoint already returns.
export async function GET() {
  const session = await getPatientSession();
  if (!session) {
    return NextResponse.json({ ok: false, error_code: "unauthorized", error: "Your session expired. Please sign in again." }, { status: 401 });
  }

  const service = createServiceClient();
  const { data: patient, error } = await service
    .from("patients")
    .select("id, full_name, phone, gender, age, address, created_at")
    .eq("id", session.patientId)
    .maybeSingle();

  if (error || !patient) {
    return NextResponse.json({ ok: false, error_code: "not_found", error: "Could not find your patient record." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, patient: toApiPatient(patient) });
}
