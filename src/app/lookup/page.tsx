import Link from "next/link";
import { ArrowLeft, Search, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Reveal } from "@/components/motion/reveal";
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
    <main className="flex min-h-[calc(100dvh-3.5rem)] flex-1 flex-col justify-center bg-[#f7fbfb] px-4 py-14 sm:px-6">
      <div className="mx-auto w-full max-w-md">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1 self-start rounded-sm text-sm font-medium text-[#60717a] outline-none transition-colors hover:text-[#071923] focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <ArrowLeft className="size-3.5" />
          {t("back_to_home", locale)}
        </Link>

        <Reveal>
          <div className="rounded-[1.75rem] bg-white p-6 shadow-[0_24px_80px_-55px_rgba(8,50,115,0.55)] ring-1 ring-[#e5eef0] sm:p-7">
            <span className="flex size-12 items-center justify-center rounded-full bg-[#e8f7f4] text-[#01b7bb]">
              <Search className="size-5" />
            </span>
            <h1 className="mt-4 text-xl font-bold tracking-tight text-[#071923]">
              {t("lookup_title", locale)}
            </h1>
            <p className="mt-1 text-sm text-[#60717a]">{t("lookup_body", locale)}</p>

            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-xl bg-[#fff4f0] px-3.5 py-3 text-sm text-[#9b2c12]">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <form action={lookupPatient} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="referenceNumber" className="text-sm font-bold text-[#071923]">
                  {t("lookup_reference_label", locale)}
                </label>
                <Input
                  id="referenceNumber"
                  name="referenceNumber"
                  className="h-11 rounded-xl bg-[#f8fbfd]"
                  placeholder="AF24-2026-00000"
                  defaultValue={ref}
                  autoComplete="off"
                  required
                />
              </div>

              <PinOrDobFields locale={locale} />

              <Button
                type="submit"
                size="lg"
                className="h-12 w-full rounded-full bg-[#01b7bb] font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#019ea2] active:translate-y-0 active:scale-[0.98]"
              >
                {t("lookup_submit_cta", locale)}
              </Button>
            </form>
          </div>
        </Reveal>
      </div>
    </main>
  );
}
