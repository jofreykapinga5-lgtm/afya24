"use client";

import { Suspense, use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import { CallRoom } from "@/components/video/call-room";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";

type JoinInfo = {
  serverUrl: string;
  token: string;
  role: "patient" | "provider";
  patientHasFullAccount: boolean;
};

export default function ConsultationPage(props: {
  params: Promise<{ appointmentId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 items-center justify-center px-4 py-20">
          <p className="text-sm text-muted-foreground">…</p>
        </main>
      }
    >
      <ConsultationPageInner {...props} />
    </Suspense>
  );
}

function ConsultationPageInner({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const { appointmentId } = use(params);
  const locale = useAppStore((state) => state.locale);
  const searchParams = useSearchParams();
  // Spoofable via URL, harmless -- only sets this participant's own local
  // default camera state, which CallControls already lets them toggle.
  const initialVideoEnabled = searchParams.get("mode") !== "voice";
  const [join, setJoin] = useState<JoinInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/video/room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointmentId, locale }),
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? t("consultation_couldnt_start", locale));
        if (!cancelled) setJoin(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId]);

  if (error) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-3 px-4 py-20 text-center">
        <TriangleAlert className="size-8 text-urgent" />
        <p className="font-semibold">{t("consultation_couldnt_join", locale)}</p>
        <p className="text-sm text-muted-foreground">{error}</p>
      </main>
    );
  }

  if (!join) {
    return (
      <main className="flex flex-1 items-center justify-center px-4 py-20">
        <p className="text-sm text-muted-foreground">{t("consultation_connecting", locale)}</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] flex-1 flex-col">
      <CallRoom
        serverUrl={join.serverUrl}
        token={join.token}
        initialVideoEnabled={initialVideoEnabled}
        showAccountUpgrade={join.role === "patient" && !join.patientHasFullAccount}
      />
    </main>
  );
}
