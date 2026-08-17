import { NextResponse } from "next/server";
import { createPatientSession, verifyAccountClaimToken } from "@/lib/patient-session";

// Plain, non-streaming route on purpose: the createPatientAccount tool (in
// /api/assistant/chat) can't reliably set cookies itself because that route's
// Response is already streaming by the time the tool's execute() resolves.
// This route turns a short-lived signed claim token into the real session
// cookie, in a response that hasn't started streaming yet.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const claimToken = body?.claimToken;

  if (typeof claimToken !== "string") {
    return NextResponse.json({ error: "claimToken is required" }, { status: 400 });
  }

  const patientId = await verifyAccountClaimToken(claimToken);
  if (!patientId) {
    return NextResponse.json({ error: "Invalid or expired claim" }, { status: 401 });
  }

  await createPatientSession(patientId);
  return NextResponse.json({ ok: true });
}
