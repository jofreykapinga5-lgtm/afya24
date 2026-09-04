import { NextResponse } from "next/server";
import { getPatientSession } from "@/lib/patient-session";
import { deletePatientAccount } from "@/lib/patient-account";

// App Store Guideline 5.1.1(v) -- real in-app self-service deletion, mobile
// side. Mirrors the web Server Action (account/actions.ts's deleteAccount),
// same deletePatientAccount() underneath (see lib/patient-account.ts for the
// anonymize-not-hard-delete rationale). No confirm-phrase check here -- that
// friction belongs in the RN confirmation screen's UI, the way the web
// settings page's "type DELETE" input works, not duplicated as a server
// contract; a Bearer-authenticated POST to this endpoint is already a
// deliberate, single-purpose action.
export async function POST() {
  const session = await getPatientSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Your session expired. Please sign in again." }, { status: 401 });
  }

  try {
    await deletePatientAccount(session.patientId);
  } catch (error) {
    console.error("deletePatientAccount failed", error);
    return NextResponse.json({ ok: false, error: "Could not delete your account. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
