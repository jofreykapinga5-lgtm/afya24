"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Hash, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionHeading } from "@/components/home/section-heading";
import { Reveal } from "@/components/motion/reveal";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";

export function ReturningPatient() {
  const router = useRouter();
  const locale = useAppStore((state) => state.locale);
  const setPatientReference = useAppStore((state) => state.setPatientReference);
  const [reference, setReference] = useState("");

  function lookup() {
    const trimmed = reference.trim();
    if (trimmed) {
      setPatientReference(trimmed);
      router.push(`/lookup?ref=${encodeURIComponent(trimmed)}`);
    } else {
      router.push("/lookup");
    }
  }

  return (
    <section className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_minmax(0,22rem)] lg:items-center lg:gap-10">
      <div className="max-w-xl">
        <SectionHeading eyebrow={t("lookup_reference_label", locale)}>
          <span className="text-[#01b7bb]">{t("returning_patient_title", locale)}</span>
        </SectionHeading>
        <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-muted-foreground sm:text-base">
          {t("returning_patient_body", locale)}{" "}
          <Link href="/account" className="font-medium text-primary underline-offset-4 hover:underline">
            {t("returning_patient_sign_in", locale)}
          </Link>{" "}
          {t("returning_patient_if_account", locale)}
        </p>
      </div>

      <Reveal>
        <div className="rounded-[1.75rem] bg-white p-6 shadow-[0_24px_80px_-55px_rgba(8,50,115,0.55)] ring-1 ring-[#e5eef0] sm:p-7">
          <span className="flex size-12 items-center justify-center rounded-full bg-[#e8f7f4] text-[#01b7bb]">
            <Search className="size-5" />
          </span>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              lookup();
            }}
            className="mt-4"
          >
            <label htmlFor="home-reference" className="text-sm font-bold text-[#071923]">
              {t("lookup_reference_label", locale)}
            </label>
            <div className="relative mt-1.5">
              <Hash className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#8a969c]" />
              <Input
                id="home-reference"
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                placeholder="AF24-2026-00000"
                autoComplete="off"
                spellCheck={false}
                className="h-11 rounded-xl bg-[#f8fbfd] pl-10 font-mono"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="mt-4 h-12 w-full rounded-full bg-[#01b7bb] font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#019ea2] active:translate-y-0 active:scale-[0.98]"
            >
              {t("returning_patient_lookup_cta", locale)}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </form>

          <Link
            href="/account/sign-up"
            className="mt-3 block text-center text-xs font-medium text-[#60717a] underline-offset-4 transition-colors hover:text-[#083273] hover:underline"
          >
            {t("returning_patient_new_here", locale)}
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
