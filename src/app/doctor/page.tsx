import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2, TriangleAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getServerLocale } from "@/lib/locale-cookie";
import { t } from "@/lib/i18n";
import { signIn } from "./actions";

export default async function DoctorSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; redirectTo?: string; reset?: string }>;
}) {
  const { error, redirectTo = "/doctor/dashboard", reset } = await searchParams;
  const locale = await getServerLocale();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    let profile: { role: string } | null = null;

    try {
      const service = createServiceClient();
      const { data } = await service
        .from("users")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      profile = data;
    } catch {
      profile = null;
    }

    if (profile?.role === "admin") {
      redirect("/admin/dashboard");
    }

    if (profile?.role === "doctor") {
      redirect(redirectTo);
    }

    redirect("/");
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-14 sm:px-6">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 self-start rounded-sm text-sm font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <ArrowLeft className="size-3.5" />
        {t("back_to_home", locale)}
      </Link>

      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <h1 className="text-xl font-semibold">{t("doctor_signin_title", locale)}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("doctor_signin_body", locale)}{" "}
          <Link href="/account" className="font-medium text-primary hover:underline">
            {t("doctor_signin_patient_link", locale)}
          </Link>
          .
        </p>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-urgent/30 bg-urgent-soft px-3.5 py-3 text-sm text-urgent">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {reset && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-3.5 py-3 text-sm">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
            <p>{t("doctor_reset_password_success", locale)}</p>
          </div>
        )}

        <form action={signIn} className="mt-6 space-y-4">
          <input type="hidden" name="redirectTo" value={redirectTo} />

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium">
              {t("doctor_email_label", locale)}
            </label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="password" className="text-sm font-medium">
                {t("account_password_placeholder", locale)}
              </label>
              <Link
                href="/doctor/forgot-password"
                className="text-xs font-medium text-primary hover:underline"
              >
                {t("doctor_forgot_password_link", locale)}
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>

          <SubmitButton
            className="h-11 w-full rounded-xl"
            pendingText={t("doctor_sign_in_pending", locale)}
          >
            {t("doctor_sign_in_cta", locale)}
          </SubmitButton>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs font-semibold text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          {t("account_divider_or", locale)}
          <span className="h-px flex-1 bg-border" />
        </div>

        <GoogleSignInButton locale={locale} redirectTo={redirectTo} context="staff" />
      </div>
    </main>
  );
}
