"use client";

import { useActionState } from "react";
import { ArrowUpRight, Check, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/home/section-heading";
import { subscribeEmail, type SubscribeState } from "@/app/actions";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";

const initialState: SubscribeState = {};

export function EmailCapture() {
  const locale = useAppStore((state) => state.locale);
  const [state, formAction, isPending] = useActionState(subscribeEmail, initialState);

  return (
    <section className="relative overflow-hidden rounded-[1.75rem] bg-[#f6f8f8] px-6 py-14 ring-1 ring-black/5 sm:px-10 sm:py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(rgba(15,23,42,0.07)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black,transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 left-1/2 size-72 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl"
      />

      <div className="relative mx-auto flex max-w-xl flex-col">
        <SectionHeading eyebrow={t("email_capture_badge", locale)} body={t("email_capture_body", locale)}>
          <span className="text-[#01b7bb]">{t("email_capture_title", locale)}</span>
        </SectionHeading>

        <div className="mt-8 w-full max-w-md">
          {state.success ? (
            <div className="flex items-center justify-center gap-2 rounded-full border border-primary/20 bg-primary-soft px-5 py-3 text-sm font-medium text-accent-foreground">
              <Check className="size-4 shrink-0" />
              {t("email_capture_success", locale)}
            </div>
          ) : (
            <>
              <form
                action={formAction}
                className="group focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 relative flex w-full items-center rounded-full border border-border bg-white p-1.5 shadow-sm transition-all hover:shadow-md"
              >
                <div className="pointer-events-none flex items-center justify-center py-2 pr-2.5 pl-3.5 text-muted-foreground transition-colors group-focus-within:text-primary">
                  <Mail className="size-4.5" />
                </div>

                <input
                  name="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="h-9 min-w-0 flex-1 border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />

                <Button
                  type="submit"
                  disabled={isPending}
                  size="icon"
                  className="size-11 shrink-0 rounded-full"
                  aria-label={
                    isPending
                      ? t("email_capture_joining", locale)
                      : t("email_capture_subscribe", locale)
                  }
                >
                  <ArrowUpRight className="size-4.5" />
                </Button>
              </form>
              {state.error && <p className="mt-3 text-sm text-urgent">{state.error}</p>}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
