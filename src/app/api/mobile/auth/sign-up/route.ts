import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createStatelessAuthClient } from "@/lib/supabase/anon";
import { createServiceClient } from "@/lib/supabase/service";
import { signPatientSessionToken, LONG_TTL_SECONDS } from "@/lib/patient-session";
import { patientAuthEmailFromPhone } from "@/lib/patient-auth-email";
import { normalizeTanzanianPhoneToE164 } from "@/lib/phone";
import { toTitleCase } from "@/lib/format-name";
import { checkRateLimit, getClientIpFromRequest } from "@/lib/rate-limit";

// Mobile-native equivalent of account/actions.ts's signUp -- same account
// creation (Supabase Auth user + patients row), but returns the session as
// JSON (the JWT in the body) instead of redirect() + cookies().set(), for
// the same reason sign-in/route.ts does. See that file's comment for the
// full rationale -- not repeated here.
export async function POST(request: NextRequest) {
  const { allowed } = await checkRateLimit("signup", getClientIpFromRequest(request));
  if (!allowed) {
    return NextResponse.json(
      { ok: false, error_code: "rate_limited", error: "Too many attempts. Please wait a while and try again." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const rawPhone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const firstName = typeof body?.firstName === "string" ? body.firstName.trim() : "";
  const lastName = typeof body?.lastName === "string" ? body.lastName.trim() : "";
  const fullName = `${firstName} ${lastName}`.trim();

  if (!rawPhone || !password || !firstName || !lastName) {
    return NextResponse.json(
      { ok: false, error_code: "missing_fields", error: "Fill in your name, phone number, and password." },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { ok: false, error_code: "password_too_short", error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const phone = normalizeTanzanianPhoneToE164(rawPhone);
  const service = createServiceClient();
  const authEmail = patientAuthEmailFromPhone(phone);

  const { data, error } = await service.auth.admin.createUser({
    email: authEmail,
    password,
    email_confirm: true,
    phone,
    phone_confirm: true,
    user_metadata: { full_name: fullName, phone, role: "patient" },
  });

  if (error) {
    return NextResponse.json({ ok: false, error_code: "signup_failed", error: error.message }, { status: 400 });
  }

  const userId = data.user?.id;
  if (!userId) {
    return NextResponse.json(
      { ok: false, error_code: "signup_failed", error: "Could not create your account. Please try again." },
      { status: 500 }
    );
  }

  const { data: insertedPatient, error: insertError } = await service
    .from("patients")
    .insert({ user_id: userId, full_name: fullName, phone })
    .select("id")
    .single();

  if (insertError || !insertedPatient) {
    await service.auth.admin.deleteUser(userId);
    return NextResponse.json(
      { ok: false, error_code: "signup_failed", error: insertError?.message ?? "Could not create your account. Please try again." },
      { status: 500 }
    );
  }

  // Confirms the password was actually accepted (mirrors the web app's own
  // signUp, which signs in right after creating the user rather than
  // assuming createUser's password is immediately usable).
  const authClient = createStatelessAuthClient();
  const { error: signInError } = await authClient.auth.signInWithPassword({ email: authEmail, password });
  if (signInError) {
    return NextResponse.json({ ok: false, error_code: "signup_failed", error: signInError.message }, { status: 500 });
  }

  const token = await signPatientSessionToken(insertedPatient.id, LONG_TTL_SECONDS);

  return NextResponse.json({
    ok: true,
    token,
    expiresIn: LONG_TTL_SECONDS,
    patient: { id: insertedPatient.id, fullName: toTitleCase(fullName), phone },
  });
}
