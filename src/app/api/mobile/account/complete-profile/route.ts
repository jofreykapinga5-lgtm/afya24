import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getPatientSession } from "@/lib/patient-session";
import { updatePatientOptionalProfile } from "@/lib/patient-account";

// Mobile equivalent of account/welcome/actions.ts's completeOptionalProfile
// -- the post-signup "tell us about yourself" step, every field optional
// (see updatePatientOptionalProfile's own comment). A "skip" tap on the RN
// screen just never calls this at all, same as the web app's separate
// skipOptionalProfile action.
export async function POST(request: NextRequest) {
  const session = await getPatientSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Your session expired. Please sign in again." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const fullName = typeof body?.fullName === "string" ? body.fullName.trim() : "";
  const rawGender = typeof body?.gender === "string" ? body.gender : "";
  const gender = rawGender === "female" || rawGender === "male" || rawGender === "other" ? rawGender : undefined;
  const age = typeof body?.age === "number" && Number.isFinite(body.age) ? body.age : undefined;
  const location = typeof body?.location === "string" ? body.location.trim() : "";

  try {
    await updatePatientOptionalProfile(session.patientId, {
      fullName: fullName || undefined,
      gender,
      age,
      location: location || undefined,
    });
  } catch (error) {
    console.error("updatePatientOptionalProfile failed", error);
    return NextResponse.json({ ok: false, error: "Could not save this. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
