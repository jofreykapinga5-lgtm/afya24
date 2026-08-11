"use client";

import { TriangleAlert } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";

export function EmergencyBanner() {
  const locale = useAppStore((state) => state.locale);

  return (
    <div className="flex items-start gap-3 rounded-lg border border-urgent/30 bg-urgent-soft px-4 py-3 text-sm">
      <TriangleAlert className="mt-0.5 size-4 shrink-0 text-urgent" />
      <div>
        <p className="font-semibold text-urgent">{t("emergency_title", locale)}</p>
        <p className="mt-0.5 text-urgent/90">{t("emergency_body", locale)}</p>
      </div>
    </div>
  );
}
