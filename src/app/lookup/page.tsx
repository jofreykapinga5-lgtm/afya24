import Link from "next/link";
import { ArrowLeft, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getServerLocale } from "@/lib/locale-cookie";
import { t } from "@/lib/i18n";
import { lookupPatient } from "./actions";
import { PinOrDobFields } from "./pin-or-dob-fields";

export default async function LookupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ref?: string }>;
}) {
  const { error, ref } = await searchParams;
  const locale = await getServerLocale();

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
        <h1 className="text-xl font-semibold">{t("lookup_title", locale)}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("lookup_body", locale)}</p>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-urgent/30 bg-urgent-soft px-3.5 py-3 text-sm text-urgent">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form action={lookupPatient} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="referenceNumber" className="text-sm font-medium">
              {t("lookup_reference_label", locale)}
            </label>
            <Input
              id="referenceNumber"
              name="referenceNumber"
              placeholder="AF24-2026-00000"
              defaultValue={ref}
              autoComplete="off"
              required
            />
          </div>

          <PinOrDobFields locale={locale} />

          <Button type="submit" className="h-11 w-full rounded-xl">
            {t("lookup_submit_cta", locale)}
          </Button>
        </form>
      </div>
    </main>
  );
}
