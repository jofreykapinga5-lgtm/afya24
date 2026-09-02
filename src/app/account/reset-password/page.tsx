import Link from "next/link";
import { redirect } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import { SubmitButton } from "@/components/submit-button";
import { getServerLocale } from "@/lib/locale-cookie";
import { t } from "@/lib/i18n";
import { requestPatientPasswordReset, resetPatientPassword } from "../actions";

export default async function AccountResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ phone?: string; error?: string }>;
}) {
  const { phone, error } = await searchParams;
  const locale = await getServerLocale();

  // Only reachable after requesting a code -- the phone comes back as a
  // query param from that redirect. No phone means someone landed here
  // directly, not through the real flow.
  if (!phone) {
    redirect("/account/forgot-password");
  }

  return (
    <main className="flex min-h-[100dvh] flex-col justify-center bg-white px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-sm">
        <div className="text-center">
          <h1 className="text-[28px] font-bold tracking-tight text-[#071923] sm:text-3xl">
            {t("account_reset_password_title", locale)}
          </h1>
          <p className="mt-2 text-sm text-[#5d6970]">{t("account_reset_password_body", locale)}</p>
        </div>

        {error && (
          <div className="mt-5 flex items-start gap-2 rounded-2xl border border-urgent/30 bg-urgent-soft px-3.5 py-3 text-sm text-urgent">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form action={resetPatientPassword} className="mt-6 space-y-3">
          <input type="hidden" name="phone" value={phone} />

          <label htmlFor="code" className="text-sm font-medium text-[#071923]">
            {t("account_reset_password_code_label", locale)}
          </label>
          <input
            id="code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
            className="h-13 w-full rounded-2xl border border-[#d8e5e3] bg-[#f8fbfa] px-4 text-center text-lg font-bold tracking-[0.4em] text-[#071923] outline-none placeholder:text-[#77858b] focus-visible:border-[#01b7bb] focus-visible:ring-3 focus-visible:ring-[#01b7bb]/20"
          />

          <label htmlFor="password" className="text-sm font-medium text-[#071923]">
            {t("account_reset_password_new_label", locale)}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            className="h-13 w-full rounded-2xl border border-[#d8e5e3] bg-[#f8fbfa] px-4 text-base text-[#071923] outline-none placeholder:text-[#77858b] focus-visible:border-[#01b7bb] focus-visible:ring-3 focus-visible:ring-[#01b7bb]/20"
          />

          <label htmlFor="confirmPassword" className="text-sm font-medium text-[#071923]">
            {t("account_reset_password_confirm_label", locale)}
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            className="h-13 w-full rounded-2xl border border-[#d8e5e3] bg-[#f8fbfa] px-4 text-base text-[#071923] outline-none placeholder:text-[#77858b] focus-visible:border-[#01b7bb] focus-visible:ring-3 focus-visible:ring-[#01b7bb]/20"
          />

          <SubmitButton
            pendingText={t("common_please_wait", locale)}
            className="h-13 w-full rounded-full bg-[#01b7bb] text-base font-bold text-white hover:bg-[#019ea2] focus-visible:ring-3 focus-visible:ring-[#01b7bb]/25"
          >
            {t("account_reset_password_cta", locale)}
          </SubmitButton>
        </form>

        <form action={requestPatientPasswordReset} className="mt-3">
          <input type="hidden" name="phone" value={phone} />
          <button
            type="submit"
            className="w-full text-center text-sm font-medium text-[#60717a] underline-offset-4 hover:text-[#083273] hover:underline"
          >
            {t("account_reset_password_resend", locale)}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link href="/account" className="text-sm font-bold text-[#083273] hover:underline">
            {t("doctor_forgot_password_back", locale)}
          </Link>
        </div>
      </div>
    </main>
  );
}
