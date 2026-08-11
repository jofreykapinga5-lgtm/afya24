"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";

const symptomChips = [
  "Fever",
  "Headache",
  "Skin issue",
  "Prescription refill",
  "Child care",
  "Lab follow-up",
  "Mental health",
];

export function AiChatHeroCard() {
  const router = useRouter();
  const locale = useAppStore((state) => state.locale);
  const setQualificationComplaint = useAppStore((state) => state.setQualificationComplaint);
  const [complaint, setComplaint] = useState("");

  function startAssessment(seed?: string) {
    setQualificationComplaint(seed ?? complaint);
    router.push("/qualification");
  }

  return (
    <div className="w-full space-y-3">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_24px_60px_-24px_rgba(15,23,42,0.25)]">
        <div className="px-5 pt-5 pb-4">
          <input
            id="hero-symptom-input"
            value={complaint}
            onChange={(event) => setComplaint(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && complaint.trim()) startAssessment();
            }}
            placeholder={t("home_input_placeholder", locale)}
            className="min-h-11 w-full bg-transparent text-lg text-foreground outline-none placeholder:text-muted-foreground md:text-xl"
          />
        </div>

        <div className="flex flex-col gap-3 border-t border-border px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="size-3.5" />
            {t("private_secure_badge", locale)}
          </span>
          <Button
            className="h-11 w-full gap-2 rounded-xl px-5 shadow-[0_12px_30px_-12px_rgba(5,50,115,0.55)] transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:shadow-none sm:w-auto"
            disabled={complaint.trim().length === 0}
            onClick={() => startAssessment()}
          >
            {t("start_assessment_cta", locale)}
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {symptomChips.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => startAssessment(chip)}
            className="inline-flex min-h-10 items-center rounded-full border border-border bg-card/70 px-4 text-sm font-medium text-muted-foreground outline-none transition-colors hover:border-primary/40 hover:bg-primary-soft hover:text-accent-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
}
