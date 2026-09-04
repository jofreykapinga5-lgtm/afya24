import Image from "next/image";
import Link from "next/link";
import { TriangleAlert, ShieldAlert } from "lucide-react";
import { redirect } from "next/navigation";
import { getServerLocale } from "@/lib/locale-cookie";
import { t } from "@/lib/i18n";
import { SubmitButton } from "@/components/submit-button";
import { requestPatientOtp, verifyPatientOtp } from "../actions";

export default async function VerifyOtpPage({
  searchParams,
}: {
  searchParams: Promise<{ phone?: string; redirectTo?: string; error?: string; devOtp?: string }>;
}) {
  const { phone, redirectTo, error, devOtp } = await searchParams;
  const locale = await getServerLocale();

  // Nothing to verify without a phone -- send back to the entry step rather
  // than rendering a broken code form with no context.
  if (!phone) {
    redirect(redirectTo ? `/account?redirectTo=${encodeURIComponent(redirectTo)}` : "/account");
  }

  const changeNumberHref = redirectTo ? `/account?redirectTo=${encodeURIComponent(redirectTo)}` : "/account";

  return (
    <main className="flex min-h-[100dvh] flex-col bg-white">
      <div className="sticky top-0 z-30 border-b border-[#edf2f1] bg-white/95 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-5xl items-center">
          <Link href="/" className="inline-flex items-center">
            <Image
              src="/brand/afya24-logo-header.png"
              alt="Afya24"
              width={220}
              height={70}
              priority
              style={{ width: "auto" }}
              className="h-8"
            />
          </Link>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-10 sm:px-6">
        <div className="text-center">
          <h1 className="text-[28px] font-bold tracking-tight text-[#071923] sm:text-3xl">
            {t("account_verify_title", locale)}
          </h1>
          <p className="mt-2 text-sm text-[#5d6970]">
            {t("account_verify_body", locale)} <span className="font-semibold text-[#071923]">{phone}</span>
          </p>
        </div>

        {devOtp && (
          <div className="mt-5 flex items-start gap-2 rounded-2xl border border-amber-300 bg-amber-50 px-3.5 py-3 text-sm text-amber-800">
            <ShieldAlert className="mt-0.5 size-4 shrink-0" />
            <p>
              {t("account_dev_otp_banner", locale)}{" "}
              <span className="font-mono text-base font-bold tracking-widest">{devOtp}</span>
            </p>
          </div>
        )}

        {error && (
          <div className="mt-5 flex items-start gap-2 rounded-2xl border border-urgent/30 bg-urgent-soft px-3.5 py-3 text-sm text-urgent">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form action={verifyPatientOtp} className="mt-6 space-y-3">
          <input type="hidden" name="phone" value={phone} />
          {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}
          <label htmlFor="code" className="sr-only">
            {t("account_verify_code_label", locale)}
          </label>
          <input
            id="code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder={t("account_verify_code_placeholder", locale)}
            required
            className="h-14 w-full rounded-2xl border border-[#d8e5e3] bg-[#f8fbfa] px-4 text-center text-2xl font-bold tracking-[0.4em] text-[#071923] outline-none placeholder:text-sm placeholder:font-normal placeholder:tracking-normal placeholder:text-[#a8b4b8] focus-visible:border-[#01b7bb] focus-visible:ring-3 focus-visible:ring-[#01b7bb]/20"
          />
          <SubmitButton
            pendingText={t("common_please_wait", locale)}
            className="h-13 w-full rounded-full bg-[#01b7bb] text-base font-bold text-white hover:bg-[#019ea2] focus-visible:ring-3 focus-visible:ring-[#01b7bb]/25"
          >
            {t("account_verify_cta", locale)}
          </SubmitButton>
        </form>

        <div className="mt-4 flex flex-col items-center gap-2">
          <form action={requestPatientOtp}>
            <input type="hidden" name="phone" value={phone} />
            {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}
            <button type="submit" className="text-sm font-semibold text-[#083273] hover:underline">
              {t("account_verify_resend", locale)}
            </button>
          </form>
          <Link href={changeNumberHref} className="text-sm text-[#5d6970] hover:underline">
            {t("account_verify_change_number", locale)}
          </Link>
        </div>
      </div>
    </main>
  );
}
