import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getPatientSession } from "@/lib/patient-session";
import { createServiceClient } from "@/lib/supabase/service";

// Registers (or updates) this patient's Expo push token -- called once
// after sign-in and again whenever Expo hands the app a fresh token. One
// row per patient (overwritten, not appended): a patient only ever needs
// pushes on whichever device they're currently signed in on.
export async function POST(request: NextRequest) {
  const session = await getPatientSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Your session expired. Please sign in again." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const expoPushToken = typeof body?.expoPushToken === "string" ? body.expoPushToken.trim() : "";
  if (!expoPushToken) {
    return NextResponse.json({ ok: false, error: "Missing expoPushToken." }, { status: 400 });
  }

  const service = createServiceClient();
  const { error } = await service.from("patient_push_tokens").upsert(
    {
      patient_id: session.patientId,
      expo_push_token: expoPushToken,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "patient_id" }
  );

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
