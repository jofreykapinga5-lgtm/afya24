import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getPatientSession } from "@/lib/patient-session";
import { getServerLocale } from "@/lib/locale-cookie";
import { t } from "@/lib/i18n";
import { WelcomeForm } from "./welcome-form";

export default async function AccountWelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const { redirectTo } = await searchParams;
  const locale = await getServerLocale();

  // Only a just-signed-in patient should land here -- not a real gate
  // (nothing sensitive is shown), just avoids rendering a form with
  // nothing to save against.
  const session = await getPatientSession();
  if (!session) {
    redirect("/account");
  }

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
            {t("account_welcome_title", locale)}
          </h1>
          <p className="mt-2 text-sm text-[#5d6970]">{t("account_welcome_subtitle", locale)}</p>
        </div>

        <WelcomeForm locale={locale} redirectTo={redirectTo} />
      </div>
    </main>
  );
}
