"use client";

import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import { playQueueAlertSound, startQueueTitleFlash, stopQueueTitleFlash } from "@/lib/doctor-queue-alert";
import { DoctorVideoQueue, type QueueItem } from "./video-queue";
import { DoctorCompletedList, type CompletedItem } from "./completed-list";

type Tab = "queue" | "completed";

// Reads #queue / #completed on mount so the Overview page's clickable
// Foleni/Zilizokamilika stats can link straight to the right tab, instead
// of always landing on the queue and making the doctor click again.
function tabFromHash(): Tab {
  if (typeof window === "undefined") return "queue";
  return window.location.hash === "#completed" ? "completed" : "queue";
}

export function DoctorPatientTabs({
  initialQueueItems,
  initialCompletedItems,
}: {
  initialQueueItems: QueueItem[];
  initialCompletedItems: CompletedItem[];
}) {
  const locale = useAppStore((state) => state.locale);
  // Deterministic first render (server and client agree on "queue") --
  // the real hash-based tab is applied in an effect, after hydration, the
  // same pattern used for the admin sidebar's active-tab tracking. Also
  // listens for hashchange so browser back/forward between the two
  // Overview stat links (#queue / #completed) updates the visible tab too.
  const [tab, setTab] = useState<Tab>("queue");
  // Owned here, not inside DoctorVideoQueue -- the tab label's "(N)" count
  // needs the same live-polled list the queue itself renders, or the two
  // silently drift apart (confirmed: the label showed "(0)" while the
  // queue below it listed 2 real patients, since the label only ever saw
  // this component's first-render prop, never the poll's updates).
  const [queueItems, setQueueItems] = useState(initialQueueItems);
  // Tracks which appointment ids were already in the queue, so the alert
  // only fires for a genuine new arrival while this tab has stayed open --
  // never on the very first load (null means "haven't compared yet"),
  // which would otherwise alert for patients who were already waiting
  // before the doctor opened the page.
  const seenQueueIdsRef = useRef<Set<string> | null>(null);
  // The polling effect below intentionally never re-runs (empty deps, so the
  // interval survives every render), so a value it closes over directly
  // would be frozen at whatever it was on the very first tick -- which can
  // run before the persisted Zustand store finishes rehydrating locale from
  // localStorage, permanently flashing the title in the wrong language for
  // the rest of the page's life. Kept current via the effect just below.
  const localeRef = useRef(locale);

  useEffect(() => {
    localeRef.current = locale;
  }, [locale]);

  useEffect(() => {
    function sync() {
      setTab(tabFromHash());
    }
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function refreshQueue() {
      try {
        const response = await fetch("/api/doctor/video-queue", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { items?: QueueItem[] };
        const nextItems = data.items ?? [];
        if (cancelled) return;

        const previousIds = seenQueueIdsRef.current;
        const hasNewArrival = previousIds
          ? nextItems.some((item) => !previousIds.has(item.id))
          : false;
        seenQueueIdsRef.current = new Set(nextItems.map((item) => item.id));

        if (hasNewArrival) {
          playQueueAlertSound();
          // Flashing the title while the doctor is already looking at this
          // tab would be pointless (they'll see the new card render right
          // there) and mildly annoying -- reserve it for when the tab is in
          // the background, same as the sound is really for.
          if (document.hidden) {
            startQueueTitleFlash(t("doctor_new_patient_title_flash", localeRef.current));
          }
        }

        setQueueItems(nextItems);
      } catch {
        // Keep the last known queue on transient network errors.
      }
    }

    refreshQueue();
    const intervalId = window.setInterval(refreshQueue, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    function handleVisible() {
      if (!document.hidden) stopQueueTitleFlash();
    }
    document.addEventListener("visibilitychange", handleVisible);
    window.addEventListener("focus", handleVisible);
    return () => {
      document.removeEventListener("visibilitychange", handleVisible);
      window.removeEventListener("focus", handleVisible);
      stopQueueTitleFlash();
    };
  }, []);

  function selectTab(next: Tab) {
    setTab(next);
    window.history.replaceState(null, "", `#${next}`);
  }

  return (
    <div className="grid gap-3">
      <div className="flex gap-2 rounded-full bg-white p-1.5 shadow-[0_14px_40px_-35px_rgba(8,50,115,0.65)] ring-1 ring-[#dfe8eb]">
        <button
          type="button"
          onClick={() => selectTab("queue")}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-bold transition-colors ${
            tab === "queue" ? "bg-[#01b7bb] text-white" : "text-[#64747c] hover:bg-[#f4f8f9]"
          }`}
        >
          {t("doctor_tab_queue", locale)} ({queueItems.length})
        </button>
        <button
          type="button"
          onClick={() => selectTab("completed")}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-bold transition-colors ${
            tab === "completed" ? "bg-[#01b7bb] text-white" : "text-[#64747c] hover:bg-[#f4f8f9]"
          }`}
        >
          {t("doctor_tab_completed", locale)} ({initialCompletedItems.length})
        </button>
      </div>

      {tab === "queue" ? (
        <DoctorVideoQueue items={queueItems} />
      ) : (
        <DoctorCompletedList items={initialCompletedItems} />
      )}
    </div>
  );
}
