"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

// Safety net for doctor dashboard actions that don't return their own
// inline error state (schedule blocks, cancel slot, join queue, etc.) --
// without this, an uncaught throw from any of those crashes to a blank,
// unbranded Vercel error page instead of something a doctor can act on
// and recover from.
export default function DoctorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Doctor dashboard error", error);
  }, [error]);

  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-4 bg-[#f7fbfb] px-4 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-[#fff4f0] text-[#dc2626] ring-1 ring-[#ffd4c6]">
        <AlertTriangle className="size-7" />
      </span>
      <div>
        <h1 className="text-xl font-bold text-[#071923]">Something went wrong</h1>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          {error.message || "That action couldn't be completed. Please try again."}
        </p>
      </div>
      <div className="flex gap-3">
        <Button onClick={() => reset()}>Try again</Button>
        <Button variant="outline" nativeButton={false} render={<Link href="/doctor/dashboard" />}>
          Back to dashboard
        </Button>
      </div>
    </div>
  );
}
