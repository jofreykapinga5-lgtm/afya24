import { TriangleAlert } from "lucide-react";
import { SubmitButton } from "@/components/submit-button";
import { getServerLocale } from "@/lib/locale-cookie";
import { t } from "@/lib/i18n";
import { requestPatientPasswordReset } from "../actions";

export default async function AccountForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const locale = await getServerLocale();

  return (
    <main className="flex min-h-[100dvh] flex-col justify-center bg-white px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-sm">
        <div className="text-center">
          <h1 className="text-[28px] font-bold tracking-tight text-[#071923] sm:text-3xl">
            {t("account_forgot_password_title", locale)}
          </h1>
          <p className="mt-2 text-sm text-[#5d6970]">{t("account_forgot_password_body", locale)}</p>
        </div>

        {error && (
          <div className="mt-5 flex items-start gap-2 rounded-2xl border border-urgent/30 bg-urgent-soft px-3.5 py-3 text-sm text-urgent">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form action={requestPatientPasswordReset} className="mt-6 space-y-3">
          <label htmlFor="phone" className="text-sm font-medium text-[#071923]">
            {t("account_phone_placeholder", locale)}
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder={t("account_phone_format_example", locale)}
            pattern="(0|\+?255)?[0-9]{9}"
            title={t("account_phone_hint_title", locale)}
            required
            className="h-13 w-full rounded-2xl border border-[#d8e5e3] bg-[#f8fbfa] px-4 text-base text-[#071923] outline-none placeholder:text-[#77858b] focus-visible:border-[#01b7bb] focus-visible:ring-3 focus-visible:ring-[#01b7bb]/20"
          />

          <SubmitButton
            pendingText={t("common_please_wait", locale)}
            className="h-13 w-full rounded-full bg-[#01b7bb] text-base font-bold text-white hover:bg-[#019ea2] focus-visible:ring-3 focus-visible:ring-[#01b7bb]/25"
          >
            {t("account_forgot_password_cta", locale)}
          </SubmitButton>
        </form>
      </div>
    </main>
  );
}
