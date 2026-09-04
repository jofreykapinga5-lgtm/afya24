import "server-only";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/service";

// Phone+OTP is the only patient credential now, alongside Continue with
// Google -- see supabase/migrations/0026_patient_phone_otp.sql and
// account/actions.ts's requestPatientOtp/verifyPatientOtp. Replaces the
// old password-based sign-in and its separate SMS password-reset flow
// (lib/patient-password-reset.ts, now removed): the same "6-digit code,
// HMAC hash, timing-safe compare" shape is reused here, but keyed on phone
// in its own table rather than a hash column on an existing patients row,
// since a first-time sign-up requests a code before any patient exists.
const CODE_TTL_MS = 10 * 60 * 1000;
// A wrong guess is cheap to allow a few of (typos), but a 6-digit code is
// only ~1 in a million -- cap attempts well below where brute-forcing
// within the TTL becomes practical, and require a fresh code past that.
const MAX_ATTEMPTS = 5;

function secretKey() {
  const secret = process.env.PATIENT_SESSION_SECRET;
  if (!secret) {
    throw new Error("PATIENT_SESSION_SECRET is not set");
  }
  return secret;
}

function generateCode(): string {
  return String(randomInt(100000, 1000000));
}

function hashCode(code: string): string {
  return createHmac("sha256", secretKey()).update(code).digest("hex");
}

function codesMatch(code: string, storedHash: string): boolean {
  const expected = Buffer.from(hashCode(code));
  const actual = Buffer.from(storedHash);
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

// Generates a fresh code and stores it, replacing any outstanding one for
// this phone (requesting a new code invalidates an older unused one, same
// behavior the old password-reset flow had). Returns the raw code for the
// caller to text out -- and, until a real SMS provider is wired up, to
// surface directly as a dev-mode fallback (see requestPatientOtp).
export async function issuePatientOtp(phone: string): Promise<string> {
  const service = createServiceClient();
  const code = generateCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MS);
  const { error } = await service
    .from("patient_otp_codes")
    .upsert(
      { phone, code_hash: hashCode(code), expires_at: expiresAt.toISOString(), attempts: 0 },
      { onConflict: "phone" }
    );
  if (error) throw new Error(error.message);
  return code;
}

export type VerifyOtpResult = "ok" | "invalid" | "expired" | "too_many_attempts";

export async function verifyPatientOtp(phone: string, code: string): Promise<VerifyOtpResult> {
  const service = createServiceClient();
  const { data } = await service
    .from("patient_otp_codes")
    .select("code_hash, expires_at, attempts")
    .eq("phone", phone)
    .maybeSingle();

  if (!data) return "invalid";
  if ((data.attempts as number) >= MAX_ATTEMPTS) return "too_many_attempts";
  if (new Date(data.expires_at as string) <= new Date()) return "expired";

  if (!codesMatch(code, data.code_hash as string)) {
    await service
      .from("patient_otp_codes")
      .update({ attempts: (data.attempts as number) + 1 })
      .eq("phone", phone);
    return "invalid";
  }

  // One-time use -- can't be replayed even if it somehow leaked.
  await service.from("patient_otp_codes").delete().eq("phone", phone);
  return "ok";
}
