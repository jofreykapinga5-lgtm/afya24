"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";

// Safety net for admin dashboard actions that don't yet surface their own
// inline error state (order status updates, lab/application status changes,
// etc.) -- without this, an uncaught throw from any of those crashes to a
// blank, unbranded Vercel error page instead of something an admin can act
// on and recover from.
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useAppStore((state) => state.locale);

  useEffect(() => {
    console.error("Admin dashboard error", error);
  }, [error]);

  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-4 bg-[#f7fbfb] px-4 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-[#fff4f0] text-[#dc2626] ring-1 ring-[#ffd4c6]">
        <AlertTriangle className="size-7" />
      </span>
      <div>
        <h1 className="text-xl font-bold text-[#071923]">{t("error_page_title", locale)}</h1>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          {error.message || t("staff_error_body_fallback", locale)}
        </p>
      </div>
      <div className="flex gap-3">
        <Button onClick={() => reset()}>{t("error_page_retry", locale)}</Button>
        <Button variant="outline" nativeButton={false} render={<Link href="/admin/dashboard" />}>
          {t("staff_error_back_to_dashboard", locale)}
        </Button>
      </div>
    </div>
  );
}
