import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { getServerLocale } from "@/lib/locale-cookie";
import { t } from "@/lib/i18n";
import { CompleteProfileForm } from "./complete-profile-form";

export default async function CompleteProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; error?: string }>;
}) {
  const { redirectTo, error } = await searchParams;
  const locale = await getServerLocale();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/account");
  }

  // Already has a patient record (e.g. they hit back after finishing this
  // once already) -- nothing left to complete.
  const service = createServiceClient();
  const { data: existingPatient } = await service
    .from("patients")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (existingPatient) {
    redirect(safeRedirectPath(redirectTo, "/account/dashboard"));
  }

  const metadata = user.user_metadata as { full_name?: string; name?: string } | null;
  const suggestedName = metadata?.full_name ?? metadata?.name ?? "";

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-1 flex-col justify-center px-4 py-14 sm:px-6">
      <Link href="/" className="mb-6 inline-flex items-center self-start">
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

      <h1 className="text-2xl font-bold tracking-tight text-[#071923]">
        {t("complete_profile_title", locale)}
      </h1>
      <p className="mt-2 text-sm leading-5 text-[#5d6970]">{t("complete_profile_body", locale)}</p>

      <CompleteProfileForm locale={locale} suggestedName={suggestedName} redirectTo={redirectTo} error={error} />
    </main>
  );
}
