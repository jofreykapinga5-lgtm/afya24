import { NextResponse } from "next/server";
import { createPatientSession, verifyAccountClaimToken } from "@/lib/patient-session";
import { checkRateLimit, getClientIpFromRequest } from "@/lib/rate-limit";

// Plain, non-streaming route on purpose: the createPatientAccount tool (in
// /api/assistant/chat) can't reliably set cookies itself because that route's
// Response is already streaming by the time the tool's execute() resolves.
// This route turns a short-lived signed claim token into the real session
// cookie, in a response that hasn't started streaming yet.
export async function POST(request: Request) {
  const { allowed } = await checkRateLimit("claimToken", getClientIpFromRequest(request));
  if (!allowed) {
    return NextResponse.json({ error: "Too many attempts. Please wait a moment and try again." }, { status: 429 });
  }

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
