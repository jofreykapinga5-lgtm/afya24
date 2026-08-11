import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getServerLocale } from "@/lib/locale-cookie";
import { t } from "@/lib/i18n";
import { signIn } from "./actions";

export default async function DoctorSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; redirectTo?: string }>;
}) {
  const { error, redirectTo = "/doctor/dashboard" } = await searchParams;
  const locale = await getServerLocale();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const service = createServiceClient();
    const { data: profile } = await service
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

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
          <Link href="/lookup" className="font-medium text-primary hover:underline">
            {t("account_reference_lookup_phrase", locale)}
          </Link>{" "}
          {t("account_instead", locale)}
        </p>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-urgent/30 bg-urgent-soft px-3.5 py-3 text-sm text-urgent">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            <p>{error}</p>
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
            <label htmlFor="password" className="text-sm font-medium">
              {t("account_password_placeholder", locale)}
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>

          <Button type="submit" className="h-11 w-full rounded-xl">
            {t("doctor_sign_in_cta", locale)}
          </Button>
        </form>
      </div>
    </main>
  );
}
