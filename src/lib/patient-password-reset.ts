import "server-only";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

// A short-lived 6-digit SMS code, hashed before it ever touches the
// database (see supabase/migrations/0022_patient_password_reset.sql) --
// same HMAC-then-timingSafeEqual shape as verifySnippeWebhookSignature in
// lib/payments/snippe.ts, reusing PATIENT_SESSION_SECRET rather than adding
// another env var purely for this.
const CODE_TTL_MS = 10 * 60 * 1000;

function secretKey() {
  const secret = process.env.PATIENT_SESSION_SECRET;
  if (!secret) {
    throw new Error("PATIENT_SESSION_SECRET is not set");
  }
  return secret;
}

export function generateResetCode(): string {
  return String(randomInt(100000, 1000000));
}

export function hashResetCode(code: string): string {
  return createHmac("sha256", secretKey()).update(code).digest("hex");
}

export function verifyResetCode(code: string, storedHash: string): boolean {
  const expected = Buffer.from(hashResetCode(code));
  const actual = Buffer.from(storedHash);
  // timingSafeEqual throws on a length mismatch instead of just returning
  // false -- both hex-encoded SHA-256 digests are always the same length,
  // but guard anyway rather than let a malformed stored value crash the
  // request.
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

export function resetCodeExpiry(): Date {
  return new Date(Date.now() + CODE_TTL_MS);
}
