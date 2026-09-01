import type { FormEvent } from "react";
import { HeartPulse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DobSelect } from "@/components/dob-select";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

// Collects just enough (name, phone, date of birth) to create a lightweight,
// no-password patient record via createPatientAccountFallback -- no login,
// no account to manage. Originally built as the qualification chat's
// recovery path for when the AI's own createPatientAccount tool call never
// fires; reused as-is on the doctor booking page as the deliberate
// "continue without an account" choice for patients (elders especially) who
// find a password/Google sign-up more friction than it's worth.
export function GuestDetailsForm({
  locale,
  fallbackError,
  fallbackPending,
  onSubmit,
}: {
  locale: Locale;
  fallbackError: string | null;
  fallbackPending: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="rounded-2xl bg-[#f8fbfd] p-4 ring-1 ring-[#dfe8eb]">
      <div className="flex items-center gap-2">
        <HeartPulse className="size-4 text-[#087a7b]" />
        <p className="text-sm font-bold text-[#071923]">
          {t("qualification_fallback_title", locale)}
        </p>
      </div>
      <p className="mt-1 text-sm text-[#60717a]">
        {t("qualification_fallback_body", locale)}
      </p>
      <form onSubmit={onSubmit} className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="fallbackFullName" className="text-sm font-medium">
            {t("qualification_fallback_name_label", locale)}
          </label>
          <Input id="fallbackFullName" name="fullName" required />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="fallbackPhone" className="text-sm font-medium">
            {t("qualification_fallback_phone_label", locale)}
          </label>
          <Input id="fallbackPhone" name="phone" type="tel" required />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <span className="text-sm font-medium">{t("lookup_dob_label", locale)}</span>
          <DobSelect locale={locale} />
        </div>
        {fallbackError && <p className="text-sm text-urgent sm:col-span-2">{fallbackError}</p>}
        <Button type="submit" disabled={fallbackPending} className="h-11 rounded-full sm:col-span-2">
          {t("qualification_fallback_submit", locale)}
        </Button>
      </form>
    </div>
  );
}
