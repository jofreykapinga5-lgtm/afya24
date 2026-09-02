import Link from "next/link";
import { ArrowLeft, TriangleAlert, MailCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";
import { getServerLocale } from "@/lib/locale-cookie";
import { t } from "@/lib/i18n";
import { requestStaffPasswordReset } from "../actions";

export default async function DoctorForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const { error, sent } = await searchParams;
  const locale = await getServerLocale();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-14 sm:px-6">
      <Link
        href="/doctor"
        className="mb-6 inline-flex items-center gap-1 self-start rounded-sm text-sm font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <ArrowLeft className="size-3.5" />
        {t("doctor_forgot_password_back", locale)}
      </Link>

      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <h1 className="text-xl font-semibold">{t("doctor_forgot_password_title", locale)}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("doctor_forgot_password_body", locale)}</p>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-urgent/30 bg-urgent-soft px-3.5 py-3 text-sm text-urgent">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {sent ? (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-3.5 py-3 text-sm">
            <MailCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            <p>{t("doctor_forgot_password_sent", locale)}</p>
          </div>
        ) : (
          <form action={requestStaffPasswordReset} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium">
                {t("doctor_email_label", locale)}
              </label>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </div>

            <SubmitButton className="h-11 w-full rounded-xl" pendingText={t("doctor_sign_in_pending", locale)}>
              {t("doctor_forgot_password_cta", locale)}
            </SubmitButton>
          </form>
        )}
      </div>
    </main>
  );
}
