"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { createPatientSession } from "@/lib/patient-session";
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

  if (!fullName || !phone) {
    redirect(`${errorPath}${encodeURIComponent(t("error_fill_all_fields", locale))}${redirectToParam}`);
  }

  const normalizedPhone = normalizeTanzanianPhoneToE164(phone);
  const service = createServiceClient();

  // Someone else may already have a patient record under this phone -- same
  // reasoning as every other account-creation path here: a phone can be
  // shared within a family, so this blocks rather than silently attaching
  // this Google identity to a record that might belong to someone else.
  const { data: phoneMatch } = await service
    .from("patients")
    .select("id")
    .eq("phone", normalizedPhone)
    .maybeSingle();
  if (phoneMatch) {
    redirect(`${errorPath}${encodeURIComponent(t("doctor_direct_booking_phone_exists", locale))}${redirectToParam}`);
  }

  const { data: inserted, error: insertError } = await service
    .from("patients")
    .insert({
      user_id: user.id,
      full_name: fullName,
      phone: normalizedPhone,
      preferred_language: locale,
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    redirect(
      `${errorPath}${encodeURIComponent(insertError?.message ?? t("error_account_creation_failed", locale))}${redirectToParam}`
    );
  }

  await createPatientSession(inserted.id);
  redirect(safeRedirectPath(redirectTo, "/account/dashboard"));
}
