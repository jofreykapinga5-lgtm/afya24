import { redirect } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";
import { createClient } from "@/lib/supabase/server";
import { getServerLocale } from "@/lib/locale-cookie";
import { t } from "@/lib/i18n";
import { resetStaffPassword } from "../actions";

export default async function DoctorResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const locale = await getServerLocale();

  // Only reachable with an active recovery session -- /auth/confirm sets one
  // after the emailed link's token verifies. No session here means someone
  // landed on this URL directly, not through a real reset link.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/doctor/forgot-password");
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-14 sm:px-6">
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <h1 className="text-xl font-semibold">{t("doctor_reset_password_title", locale)}</h1>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-urgent/30 bg-urgent-soft px-3.5 py-3 text-sm text-urgent">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form action={resetStaffPassword} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium">
              {t("doctor_reset_password_new_label", locale)}
            </label>
            <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              {t("doctor_reset_password_confirm_label", locale)}
            </label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>

          <SubmitButton className="h-11 w-full rounded-xl" pendingText={t("doctor_sign_in_pending", locale)}>
            {t("doctor_reset_password_cta", locale)}
          </SubmitButton>
        </form>
      </div>
    </main>
  );
}
