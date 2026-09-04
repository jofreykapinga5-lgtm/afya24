import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { issuePatientOtp } from "@/lib/patient-otp";
import { normalizeTanzanianPhoneToE164 } from "@/lib/phone";
import { sendSms } from "@/lib/sms/africas-talking";
import { checkRateLimit, getClientIpFromRequest } from "@/lib/rate-limit";

// Mobile equivalent of account/actions.ts's requestPatientOtp -- texts a
// 6-digit code to the phone (or, until a real SMS provider is wired, see
// lib/sms/africas-talking.ts, returns it directly as devOtp so the app is
// still testable end-to-end). Same request for a first-time phone, a
// returning one, or an orphaned guest/AI-intake record -- verify-otp is
// what decides which of those this turns out to be.
export async function POST(request: NextRequest) {
  const { allowed } = await checkRateLimit("patientOtp", getClientIpFromRequest(request));
  if (!allowed) {
    return NextResponse.json(
      { ok: false, error_code: "rate_limited", error: "Too many attempts. Please wait a while and try again." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const rawPhone = typeof body?.phone === "string" ? body.phone.trim() : "";
  if (!rawPhone) {
    return NextResponse.json(
      { ok: false, error_code: "missing_fields", error: "Enter your phone number." },
      { status: 400 }
    );
  }

  const phone = normalizeTanzanianPhoneToE164(rawPhone);
  const code = await issuePatientOtp(phone);

  // NOT LIVE YET -- see lib/sms/africas-talking.ts. devOtp must come out
  // once SMS is confirmed working; it stops appearing automatically the
  // moment sendSms stops throwing.
  let devOtp: string | undefined;
  try {
    await sendSms(phone, `Your Afya24 code is ${code}. It expires in 10 minutes.`);
  } catch (err) {
    console.error("Failed to send patient OTP SMS -- falling back to devOtp", err);
    devOtp = code;
  }

  return NextResponse.json({ ok: true, phone, devOtp });
}
