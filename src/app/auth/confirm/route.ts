import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServerLocale } from "@/lib/locale-cookie";
import { t } from "@/lib/i18n";

// Supabase's default confirmation email links here with a token_hash + type.
// If your Supabase project's email template still points at the old
// /auth/v1/verify redirect shape, update it (Auth -> Email Templates) to
// point at {{ .SiteURL }}/auth/confirm instead.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/account/dashboard";

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      redirect(next);
    }
  }

  const locale = await getServerLocale();
  redirect(`/account?error=${encodeURIComponent(t("error_confirm_link_invalid", locale))}`);
}
