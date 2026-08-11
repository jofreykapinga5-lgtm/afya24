"use client";

import { Check } from "lucide-react";
import type { PharmacyOrderStatus } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { t, type TranslationKey } from "@/lib/i18n";

const statusFlow: { key: PharmacyOrderStatus; labelKey: TranslationKey }[] = [
  { key: "pending", labelKey: "pharmacy_order_pending" },
  { key: "preparing", labelKey: "pharmacy_order_preparing" },
  { key: "ready_for_pickup", labelKey: "pharmacy_status_ready_full" },
  { key: "out_for_delivery", labelKey: "pharmacy_status_delivery_full" },
  { key: "delivered", labelKey: "pharmacy_status_delivered_full" },
];

export function PharmacyStatusStepper({ status }: { status: PharmacyOrderStatus }) {
  const locale = useAppStore((state) => state.locale);
  const currentIndex = statusFlow.findIndex((step) => step.key === status);

  return (
    <ol className="space-y-0">
      {statusFlow.map((step, index) => {
        const done = index <= currentIndex;
        const isLast = index === statusFlow.length - 1;
        return (
          <li key={step.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`flex size-5 items-center justify-center rounded-full text-[10px] ${
                  done ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                }`}
              >
                {done ? <Check className="size-3" /> : index + 1}
              </span>
              {!isLast && (
                <span className={`w-px flex-1 ${index < currentIndex ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
            <p
              className={`pb-4 text-sm ${
                index === currentIndex
                  ? "font-semibold"
                  : done
                    ? "text-foreground"
                    : "text-muted-foreground"
              }`}
            >
              {t(step.labelKey, locale)}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
