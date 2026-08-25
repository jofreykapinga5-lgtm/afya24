"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Phone, UserRound, Video } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";

export interface CompletedItem {
  id: string;
  patientId: string;
  patientName: string;
  patientReference: string;
  consultationMode: "voice" | "video";
  completedAt: string;
}

type Period = "today" | "yesterday" | "week" | "30d" | "custom";

function localDateKey(iso: string) {
  // Groups only collapse visits within the same Dar es Salaam calendar day
  // -- a patient seen yesterday and today should stay as two separate
  // cards, not one, even inside a multi-day filter like "7 days".
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Africa/Dar_es_Salaam" });
}

function formatDay(dateKey: string, locale: string) {
  return new Date(`${dateKey}T12:00:00Z`).toLocaleDateString(locale === "sw" ? "sw-TZ" : "en-TZ", {
    day: "numeric",
    month: "short",
    timeZone: "Africa/Dar_es_Salaam",
  });
}

function formatTime(iso: string, locale: string) {
  return new Date(iso).toLocaleString(locale === "sw" ? "sw-TZ" : "en-TZ", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Dar_es_Salaam",
  });
}

export function DoctorCompletedList({ items: initialItems }: { items: CompletedItem[] }) {
  const locale = useAppStore((state) => state.locale);
  const [period, setPeriod] = useState<Period>("today");
  // null means "no fetch has completed yet for a non-today period" -- the
  // "today" period never touches this, it always renders initialItems
  // directly, so there's nothing to reset via setState when switching
  // back to it (the effect below only fetches for the other periods).
  const [fetchedItems, setFetchedItems] = useState<CompletedItem[] | null>(null);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (period === "today") return;
    if (period === "custom" && (!customFrom || !customTo)) return;

    let cancelled = false;

    // Named async function called (not awaited) at the top of the effect,
    // same shape as video-queue.tsx's refreshQueue -- every setState below
    // runs inside it, after an await, never synchronously in the effect
    // body itself.
    async function loadCompleted() {
      setLoading(true);
      const params = new URLSearchParams({ period });
      if (period === "custom") {
        params.set("from", customFrom);
        params.set("to", customTo);
      }
      try {
        const response = await fetch(`/api/doctor/completed-patients?${params}`, { cache: "no-store" });
        const data = (await response.json()) as { items?: CompletedItem[] };
        if (!cancelled) setFetchedItems(data.items ?? []);
      } catch {
        // Keep whatever was last shown on a transient network error.
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadCompleted();
    return () => {
      cancelled = true;
    };
  }, [period, customFrom, customTo]);

  const groups = useMemo(() => {
    const items = period === "today" ? initialItems : (fetchedItems ?? []);
    const byKey = new Map<
      string,
      { patientName: string; patientReference: string; dateKey: string; visits: CompletedItem[] }
    >();
    for (const item of items) {
      const dateKey = localDateKey(item.completedAt);
      const key = `${item.patientId}-${dateKey}`;
      const existing = byKey.get(key);
      if (existing) {
        existing.visits.push(item);
      } else {
        byKey.set(key, {
          patientName: item.patientName,
          patientReference: item.patientReference,
          dateKey,
          visits: [item],
        });
      }
    }
    return [...byKey.values()].sort(
      (a, b) => new Date(b.visits[0].completedAt).getTime() - new Date(a.visits[0].completedAt).getTime()
    );
  }, [period, initialItems, fetchedItems]);

  const periodOptions: { value: Period; labelKey: Parameters<typeof t>[0] }[] = [
    { value: "today", labelKey: "doctor_period_today" },
    { value: "yesterday", labelKey: "doctor_period_yesterday" },
    { value: "week", labelKey: "doctor_period_week" },
    { value: "30d", labelKey: "doctor_period_30d" },
    { value: "custom", labelKey: "doctor_period_custom" },
  ];

  return (
    <section className="rounded-[1.35rem] bg-white p-5 shadow-[0_14px_40px_-35px_rgba(8,50,115,0.65)] ring-1 ring-[#dfe8eb]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[#071923]">{t("doctor_completed_title", locale)}</p>
          <p className="mt-1 text-sm text-[#64747c]">{t("doctor_completed_body", locale)}</p>
        </div>
        <CheckCircle2 className="size-5 text-[#01b7bb]" />
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {periodOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setPeriod(option.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
              period === option.value
                ? "bg-[#083273] text-white"
                : "bg-[#f4f8f9] text-[#64747c] hover:bg-[#e8f7f4]"
            }`}
          >
            {t(option.labelKey, locale)}
          </button>
        ))}
      </div>

      {period === "custom" ? (
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <label className="grid gap-1 text-xs font-semibold text-[#64747c]">
            {t("doctor_period_custom_from", locale)}
            <input
              type="date"
              value={customFrom}
              onChange={(event) => setCustomFrom(event.target.value)}
              className="h-9 rounded-lg border border-[#dfe8eb] px-2 text-sm"
            />
          </label>
          <label className="grid gap-1 text-xs font-semibold text-[#64747c]">
            {t("doctor_period_custom_to", locale)}
            <input
              type="date"
              value={customTo}
              onChange={(event) => setCustomTo(event.target.value)}
              className="h-9 rounded-lg border border-[#dfe8eb] px-2 text-sm"
            />
          </label>
        </div>
      ) : null}

      <div className="mt-4 grid gap-3">
        {loading ? (
          <p className="px-1 py-6 text-center text-sm text-[#64747c]">...</p>
        ) : groups.length > 0 ? (
          groups.map((group) => (
            <div key={`${group.patientReference}-${group.dateKey}`} className="rounded-2xl bg-[#f8fbfd] p-3">
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#e8f7f4] text-sm font-bold text-[#087a7b]">
                  <UserRound className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[#071923]">{group.patientName}</p>
                  <p className="mt-0.5 text-xs text-[#64747c]">{group.patientReference}</p>
                </div>
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#e8f7f4] px-2.5 py-1 text-[11px] font-bold text-[#087a7b]">
                  {group.visits[0].consultationMode === "voice" ? (
                    <Phone className="size-3" />
                  ) : (
                    <Video className="size-3" />
                  )}
                  {group.visits.length > 1
                    ? t("doctor_completed_visit_count", locale).replace("{n}", String(group.visits.length))
                    : null}
                </span>
              </div>
              <p className="mt-2 text-xs text-[#64747c]">
                {formatDay(group.dateKey, locale)} &middot;{" "}
                {group.visits.map((visit) => formatTime(visit.completedAt, locale)).join(" · ")}
              </p>
            </div>
          ))
        ) : (
          <p className="px-1 py-6 text-center text-sm text-[#64747c]">{t("doctor_completed_empty", locale)}</p>
        )}
      </div>
    </section>
  );
}
