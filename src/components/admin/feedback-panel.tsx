"use client";

import { useMemo, useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";
import { StatusPill } from "@/components/admin/status-pill";
import { setFeedbackPublished } from "@/app/admin/actions";
import { t } from "@/lib/i18n";
import type { ConsultationFeedback, Locale } from "@/lib/types";

function PublishToggle({ feedbackId, isPublished }: { feedbackId: string; isPublished: boolean }) {
  return (
    <form action={setFeedbackPublished}>
      <input type="hidden" name="feedbackId" value={feedbackId} />
      <input type="hidden" name="isPublished" value={String(!isPublished)} />
      <SubmitButton size="sm" variant={isPublished ? "outline" : "default"}>
        {isPublished ? "Unpublish" : "Publish"}
      </SubmitButton>
    </form>
  );
}

// Same load-more pattern as payments-panel.tsx -- keeps the page short
// instead of dumping every submission (an unbounded, ever-growing list) on
// screen at once.
const PAGE_SIZE = 8;

function FeedbackStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating}/5`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`size-3.5 shrink-0 ${index < rating ? "fill-[#f2b01e] text-[#f2b01e]" : "fill-none text-border"}`}
        />
      ))}
    </div>
  );
}

export function FeedbackPanel({ locale, entries }: { locale: Locale; entries: ConsultationFeedback[] }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visibleEntries = entries.slice(0, visibleCount);
  const remaining = entries.length - visibleEntries.length;

  const averageRating = useMemo(() => {
    if (entries.length === 0) return 0;
    return entries.reduce((sum, entry) => sum + entry.rating, 0) / entries.length;
  }, [entries]);

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-lg font-semibold tracking-tight">{t("admin_feedback_title", locale)}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t("admin_feedback_subtitle", locale)}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:max-w-md">
        <div className="rounded-2xl bg-white p-4 ring-1 ring-[#dfe8eb]">
          <p className="text-2xl font-bold tabular-nums text-[#083273]">
            {entries.length > 0 ? averageRating.toFixed(1) : "—"}
          </p>
          <p className="mt-1 text-xs text-[#64747c]">{t("admin_feedback_average", locale)}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 ring-1 ring-[#dfe8eb]">
          <p className="text-2xl font-bold tabular-nums text-[#083273]">{entries.length}</p>
          <p className="mt-1 text-xs text-[#64747c]">{t("admin_feedback_total", locale)}</p>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center text-sm text-[#64747c] ring-1 ring-[#dfe8eb]">
          {t("admin_feedback_empty", locale)}
        </div>
      ) : (
        <div className="grid gap-3">
          {visibleEntries.map((entry) => (
            <div key={entry.id} className="rounded-2xl bg-white p-4 ring-1 ring-[#dfe8eb]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#071923]">{entry.patientName}</p>
                  <p className="mt-0.5 text-xs text-[#64747c]">
                    {entry.patientReference} · {entry.providerName}
                  </p>
                </div>
                <FeedbackStars rating={entry.rating} />
              </div>

              {entry.feedbackText ? (
                <div className="mt-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8a9aa2]">
                    {t("admin_feedback_private_label", locale)}
                  </p>
                  <p className="mt-1 text-sm text-[#3f4c52]">{entry.feedbackText}</p>
                </div>
              ) : null}

              {entry.testimonialText ? (
                <div className="mt-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8a9aa2]">
                      {t("admin_feedback_testimonial_label", locale)}
                    </p>
                    <StatusPill tone={entry.testimonialConsent ? "positive" : "neutral"}>
                      {entry.testimonialConsent
                        ? t("admin_feedback_consent_public", locale)
                        : t("admin_feedback_consent_private", locale)}
                    </StatusPill>
                    {entry.isPublished ? (
                      <StatusPill tone="positive">Published on profile</StatusPill>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm italic text-[#3f4c52]">&ldquo;{entry.testimonialText}&rdquo;</p>
                  {entry.testimonialConsent ? (
                    <div className="mt-2">
                      <PublishToggle feedbackId={entry.id} isPublished={entry.isPublished} />
                    </div>
                  ) : null}
                </div>
              ) : null}

              <p className="mt-3 text-xs text-[#8a9aa2]">
                {new Date(entry.createdAt).toLocaleString(locale === "sw" ? "sw-TZ" : "en-TZ", {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone: "Africa/Dar_es_Salaam",
                })}
              </p>
            </div>
          ))}
        </div>
      )}

      {remaining > 0 ? (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-full px-4 text-sm"
            onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
          >
            {t("admin_action_load_more", locale).replace("{count}", String(Math.min(remaining, PAGE_SIZE)))}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
