import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { redirectIfStaffUser } from "@/lib/staff-redirect-guard";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { getServerLocale } from "@/lib/locale-cookie";
import { t } from "@/lib/i18n";
import { PhoneOtpForm } from "../phone-otp-form";

export default async function AccountSignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; redirectTo?: string }>;
}) {
  const { error, redirectTo } = await searchParams;
  const locale = await getServerLocale();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await redirectIfStaffUser(user.id);
    redirect(safeRedirectPath(redirectTo, "/account/dashboard"));
  }

  return (
    <main className="flex min-h-[100dvh] flex-col bg-white">
      <div className="sticky top-0 z-30 border-b border-[#edf2f1] bg-white/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
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

      <div className="mx-auto w-full max-w-sm px-4 py-8 sm:px-6">
        <div className="text-center">
          <h1 className="text-[28px] font-bold tracking-tight text-[#071923] sm:text-3xl">
            {t("account_signup_title", locale)}
          </h1>
          <p className="mt-1.5 text-sm text-[#60717a]">{t("account_signup_subtitle", locale)}</p>
        </div>

        <PhoneOtpForm locale={locale} error={error} redirectTo={redirectTo} ctaLabel={t("account_create_cta", locale)} />

        <div className="mt-4 rounded-2xl bg-[#f8fbfa] p-3 text-center text-sm text-[#5d6970]">
          <span>{t("account_already_customer", locale)}</span>{" "}
          <Link
            href={redirectTo ? `/account?redirectTo=${encodeURIComponent(redirectTo)}` : "/account"}
            className="font-bold text-[#083273] hover:underline"
          >
            {t("header_log_in", locale)}
          </Link>
        </div>
      </div>
    </main>
  );
}
