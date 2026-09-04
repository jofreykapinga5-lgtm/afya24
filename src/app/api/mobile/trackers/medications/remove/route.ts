import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getPatientSession } from "@/lib/patient-session";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  const session = await getPatientSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Your session expired. Please sign in again." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : "";
  if (!id) {
    return NextResponse.json({ ok: false, error: "Missing id." }, { status: 400 });
  }

  const service = createServiceClient();
  // Ownership check via the same eq("patient_id", ...) filter every mutation
  // here uses -- confirms this medication is really this patient's before
  // touching it, not just id-only.
  const { data: owned } = await service
    .from("patient_self_medications")
    .select("id")
    .eq("id", id)
    .eq("patient_id", session.patientId)
    .maybeSingle();
  if (!owned) {
    return NextResponse.json({ ok: false, error: "Not authorized for this medication." }, { status: 403 });
  }

  // Delete doses first -- no ON DELETE CASCADE assumed on the FK.
  await service.from("patient_self_medication_doses").delete().eq("medication_id", id);
  const { error } = await service.from("patient_self_medications").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
