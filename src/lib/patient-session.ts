import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

// Short-lived signed session for patients who looked themselves up by
// hospital reference number. Patients have no Supabase Auth account in v1
// (see DATA-MODEL.md), so this is the only thing scoping "am I allowed to
// see this patient's appointment/prescriptions" for the rest of the request.
// Keep the TTL short -- this is meant to last one lookup session, not persist
// like a login.

const COOKIE_NAME = "afya24_patient_session";
const TTL_SECONDS = 30 * 60;

function secretKey() {
  const secret = process.env.PATIENT_SESSION_SECRET;
  if (!secret) {
    throw new Error("PATIENT_SESSION_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

export async function createPatientSession(patientId: string, ttlSeconds: number = TTL_SECONDS) {
  const token = await new SignJWT({ patientId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(secretKey());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ttlSeconds,
    path: "/",
  });
}

// Short-lived, single-purpose token for handing a freshly-created patientId
// from a streamed AI tool result back to a plain (non-streaming) route that
// can actually set the session cookie -- see src/app/api/patient-session/route.ts
// for why this can't just be cookies().set() inside the tool call itself.
// Signed so a leaked patientId alone (e.g. visible in the tool's streamed
// output) can't be replayed forever to mint a session as that patient.
const CLAIM_TTL_SECONDS = 120;

export async function createAccountClaimToken(patientId: string) {
  return await new SignJWT({ patientId, purpose: "claim" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${CLAIM_TTL_SECONDS}s`)
    .sign(secretKey());
}

export async function verifyAccountClaimToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (payload.purpose !== "claim" || typeof payload.patientId !== "string") return null;
    return payload.patientId;
  } catch {
    return null;
  }
}

export async function getPatientSession(): Promise<{ patientId: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (typeof payload.patientId !== "string") return null;
    return { patientId: payload.patientId };
  } catch {
    return null;
  }
}

export async function clearPatientSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
