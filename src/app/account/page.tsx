import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Check } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirectIfStaffUser } from "@/lib/staff-redirect-guard";
import { getServerLocale } from "@/lib/locale-cookie";
import { t, type TranslationKey } from "@/lib/i18n";
import { LoginForm } from "./login-form";

const benefitKeys: TranslationKey[] = [
  "account_benefit1",
  "account_benefit2",
  "account_benefit3",
];

export default async function AccountSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const locale = await getServerLocale();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await redirectIfStaffUser(user.id);
    redirect("/account/dashboard");
  }

  return (
    <main className="min-h-[100dvh] bg-white px-4 pb-5 sm:px-6 lg:px-8">
      <div className="sticky top-0 z-30 -mx-4 flex border-b border-[#edf2f1] bg-white/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
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

      <div className="mx-auto grid w-full max-w-4xl gap-10 py-8 md:grid-cols-[340px_1fr] md:items-center lg:py-10">
        <section className="relative hidden min-h-[430px] overflow-hidden rounded-[1.5rem] bg-[#f4faf9] md:block">
          <Image
            src="/images/trust/secure-records.jpg"
            alt="Doctor writing secure patient notes"
            fill
            sizes="(min-width: 768px) 340px, 100vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#071923]/55 via-transparent to-transparent" />
          <div className="absolute inset-x-4 bottom-4 rounded-[1.25rem] bg-white/88 p-4 shadow-[0_20px_60px_-35px_rgba(8,50,115,0.55)] backdrop-blur">
            <p className="text-sm font-semibold text-[#083273]">{t("brand_tagline", locale)}</p>
            <div className="mt-3 grid gap-2">
              {benefitKeys.map((key) => (
                <div key={key} className="flex items-center gap-2 text-xs text-[#4d5960]">
                  <Check className="size-4 shrink-0 text-[#01b7bb]" />
                  <span>{t(key, locale)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[430px]">
          <p className="text-sm font-semibold text-[#0a5260]">
            {t("account_welcome_back", locale)}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#071923]">
            {t("account_login_title", locale)}
          </h1>

          <LoginForm locale={locale} error={error} />

          <div className="mt-5 rounded-2xl bg-[#f8fbfa] p-4 text-center text-sm text-[#5d6970]">
            <span>{t("account_new_to_afya24", locale)}</span>{" "}
            <Link href="/account/sign-up" className="font-bold text-[#083273] hover:underline">
              {t("account_create_account_link", locale)}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
