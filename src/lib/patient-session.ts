import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/service";

// Signed session for patients -- this is the only thing scoping "am I
// allowed to see this patient's appointment/prescriptions" for the rest of
// the request, whether they're mid-AI-intake (no password yet) or fully
// logged in (see getFullAccountPatientSession below). signIn/signUp in
// account/actions.ts set this same cookie on top of the Supabase Auth
// session, since everything else in the app checks this, not Supabase's.
//
// Two TTLs, not one flat one:
// - LONG_TTL_SECONDS (~1 year, "stay logged in until you log out") for a
//   real account -- password or Google -- passed explicitly by signIn/
//   signUp/completeGoogleProfile/auth/callback. Safe to leave this long:
//   the cookie is httpOnly+secure+sameSite=lax, and logging out clears it.
// - TTL_SECONDS (24h, the default when no ttlSeconds is passed) for a
//   password-less guest/AI-intake record, which might be a shared or
//   borrowed phone with nothing to explicitly "log out" of -- this one
//   still expires on its own.
const COOKIE_NAME = "afya24_patient_session";
const TTL_SECONDS = 24 * 60 * 60;
export const LONG_TTL_SECONDS = 365 * 24 * 60 * 60;

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

// Both a real account (phone + password, patients.user_id set) and a
// still-lightweight AI-intake/"continue without an account" record use this
// same session cookie -- booking itself only ever needs getPatientSession()
// above (either kind is fine), so this stronger check is for the few spots
// that specifically care whether it's a real account, e.g. deciding whether
// to redirect an already-logged-in visitor away from /account. Server-only
// (imports service.ts).
export async function getFullAccountPatientSession(): Promise<{ patientId: string } | null> {
  const session = await getPatientSession();
  if (!session) return null;

  const service = createServiceClient();
  const { data } = await service
    .from("patients")
    .select("user_id")
    .eq("id", session.patientId)
    .maybeSingle();

  return data?.user_id ? session : null;
}
