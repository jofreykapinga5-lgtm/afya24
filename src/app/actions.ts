"use server";

import { createClient } from "@/lib/supabase/server";
import { getServerLocale } from "@/lib/locale-cookie";
import { t } from "@/lib/i18n";

export type SubscribeState = { error?: string; success?: boolean };

export async function subscribeEmail(
  _prevState: SubscribeState,
  formData: FormData
): Promise<SubscribeState> {
  const locale = await getServerLocale();
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { error: t("email_capture_enter_email_error", locale) };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("email_subscribers")
    .insert({ email, source: "landing_page" });

  if (error) {
    if (error.code === "23505") {
      return { success: true };
    }
    return { error: t("email_capture_generic_error", locale) };
  }

  return { success: true };
}
