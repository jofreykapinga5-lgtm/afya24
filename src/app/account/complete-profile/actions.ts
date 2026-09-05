"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { checkPatientPhoneCollision } from "@/lib/patient-account";
import { createPatientSession, LONG_TTL_SECONDS } from "@/lib/patient-session";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { normalizeTanzanianPhoneToE164 } from "@/lib/phone";
import { getServerLocale } from "@/lib/locale-cookie";
import { t } from "@/lib/i18n";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// Runs right after a first-time Google sign-in -- the Supabase Auth user
// already exists (Google handled that), this just attaches the one thing
// Google never provides (a phone number) and creates the matching patients
// row, same shape as every other account-creation path in this app.
export async function completeGoogleProfile(formData: FormData) {
  const locale = await getServerLocale();
  const redirectTo = String(formData.get("redirectTo") ?? "").trim();
  const redirectToParam = redirectTo ? `&redirectTo=${encodeURIComponent(redirectTo)}` : "";
  const errorPath = "/account/complete-profile?error=";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/account");
  }

  const { allowed } = await checkRateLimit("signup", await getClientIp());
  if (!allowed) {
    redirect(`${errorPath}${encodeURIComponent(t("error_rate_limited", locale))}${redirectToParam}`);
  }

  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  // Optional -- Google never provides this (gender is locked behind
  // Google's restricted "sensitive scopes," effectively unreachable for an
  // app like this), so this is the only place it can come from. Left
  // optional rather than required so this step doesn't gain extra signup
  // friction over what it already asks for.
  const rawGender = String(formData.get("gender") ?? "").trim();
  const gender = rawGender === "female" || rawGender === "male" || rawGender === "other" ? rawGender : null;

  if (!fullName || !phone) {
    redirect(`${errorPath}${encodeURIComponent(t("error_fill_all_fields", locale))}${redirectToParam}`);
  }

  const normalizedPhone = normalizeTanzanianPhoneToE164(phone);
  const service = createServiceClient();

  // Someone else may already have a patient record under this phone -- same
  // reasoning as every other account-creation path here: a phone can be
  // shared within a family, so this blocks rather than silently attaching
  // this Google identity to a record that might belong to someone else.
  // Which error (and whether "log in instead" is even true) depends on
  // whether that record has a real account behind it -- see
  // checkPatientPhoneCollision's own comment.
  const collision = await checkPatientPhoneCollision(service, normalizedPhone);
  if (collision.status === "account") {
    redirect(
      `${errorPath}${encodeURIComponent(t("account_phone_taken_body", locale))}${redirectToParam}&errorCode=phone_exists`
    );
  }
  if (collision.status === "orphan") {
    redirect(
      `${errorPath}${encodeURIComponent(t("account_phone_orphaned_body", locale))}${redirectToParam}&errorCode=phone_orphaned`
    );
  }

  const { data: inserted, error: insertError } = await service
    .from("patients")
    .insert({
      user_id: user.id,
      full_name: fullName,
      phone: normalizedPhone,
      gender,
      preferred_language: locale,
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    redirect(
      `${errorPath}${encodeURIComponent(insertError?.message ?? t("error_account_creation_failed", locale))}${redirectToParam}`
    );
  }

  // Google sign-in is a real account -- long TTL, same as signIn/signUp.
  await createPatientSession(inserted.id, LONG_TTL_SECONDS);
  // Landing page by default, same as every other patient sign-in/sign-up
  // path -- the dashboard is reached via the header's "My Account" menu.
  redirect(safeRedirectPath(redirectTo, "/"));
}
