"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";

// Root safety net. Admin and doctor already have their own error.tsx with
// staff-facing detail (the raw error message is useful when you're the one
// who broke it); this one covers every patient-facing route -- account,
// pharmacy, lookup, consultation, qualification, doctors -- most of which
// still have actions that throw directly instead of returning inline
// state. A patient shouldn't see a raw Supabase error message here, so this
// stays generic and bilingual rather than echoing error.message.
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useAppStore((state) => state.locale);

  useEffect(() => {
    console.error("Unhandled page error", error);
  }, [error]);

  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-urgent-soft text-urgent">
        <AlertTriangle className="size-7" />
      </span>
      <div>
        <h1 className="text-xl font-bold text-foreground">{t("error_page_title", locale)}</h1>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">{t("error_page_body", locale)}</p>
      </div>
      <div className="flex gap-3">
        <Button onClick={() => reset()}>{t("error_page_retry", locale)}</Button>
        <Button variant="outline" nativeButton={false} render={<Link href="/" />}>
          {t("back_to_home", locale)}
        </Button>
      </div>
    </div>
  );
}
