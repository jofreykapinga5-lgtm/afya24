"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/home/section-heading";
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
    <section className="relative overflow-hidden rounded-[1.75rem] bg-[#f6f8f8] px-5 py-8 ring-1 ring-black/5 sm:px-8 sm:py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(rgba(15,23,42,0.07)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_70%_70%_at_20%_50%,black,transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -bottom-16 size-56 rounded-full bg-primary/10 blur-3xl"
      />

      <div className="relative grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_minmax(0,22rem)] lg:items-center lg:gap-10">
        <div className="max-w-xl">
          <SectionHeading eyebrow={t("lookup_reference_label", locale)}>
            <span className="text-[#01b7bb]">
            {t("returning_patient_title", locale)}
            </span>
          </SectionHeading>
          <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t("returning_patient_body", locale)}{" "}
            <Link href="/account" className="font-medium text-primary underline-offset-4 hover:underline">
              {t("returning_patient_sign_in", locale)}
            </Link>{" "}
            {t("returning_patient_if_account", locale)}
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 lg:max-w-none">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              lookup();
            }}
            className="flex flex-col gap-2"
          >
            <label htmlFor="home-reference" className="text-sm font-medium text-foreground">
              {t("lookup_reference_label", locale)}
            </label>
            <div className="group flex w-full items-center rounded-full border border-border bg-white p-1.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/15 hover:shadow-[0_8px_24px_-16px_rgba(8,50,115,0.35)]">
              <input
                id="home-reference"
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                placeholder="AF24-2026-00000"
                autoComplete="off"
                spellCheck={false}
                className="h-10 min-w-0 flex-1 border-0 bg-transparent px-3.5 font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
              />
              <Button type="submit" className="h-10 shrink-0 gap-1.5 rounded-full px-5 font-semibold">
                {t("returning_patient_lookup_cta", locale)}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </form>
          <Link
            href="/account/sign-up"
            className="text-center text-xs font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline lg:text-right"
          >
            {t("returning_patient_new_here", locale)}
          </Link>
        </div>
      </div>
    </section>
  );
}
