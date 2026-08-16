"use client";

import { Suspense, use, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import { CallRoom } from "@/components/video/call-room";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";

type JoinInfo = {
  serverUrl: string;
  token: string;
  role: "patient" | "provider";
  patientHasFullAccount: boolean;
};

// Carries the API's error `code` (currently only "PAYMENT_REQUIRED" is
// meaningful client-side) so the UI can offer a real next step instead of a
// dead-end error message -- see api/video/room/route.ts.
class JoinRoomError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.code = code;
  }
}

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
  const [error, setError] = useState<JoinRoomError | null>(null);

  // Also used by CallRoom to get a fresh token when reconnecting after the
  // network drops the call -- the room persists (see
  // getOrCreateRoomForAppointment), so this is just re-authenticating, not
  // recreating anything.
  async function requestJoinInfo(): Promise<JoinInfo> {
    const response = await fetch("/api/video/room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointmentId, locale }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new JoinRoomError(data.error ?? t("consultation_couldnt_start", locale), data.code);
    }
    return data as JoinInfo;
  }

  useEffect(() => {
    let cancelled = false;

    requestJoinInfo()
      .then((data) => {
        if (!cancelled) setJoin(data);
      })
      .catch((err: JoinRoomError) => {
        if (!cancelled) setError(err);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId]);

  if (error) {
    const initialMode = searchParams.get("mode") === "voice" ? "voice" : "video";
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-3 px-4 py-20 text-center">
        <TriangleAlert className="size-8 text-urgent" />
        <p className="font-semibold">{t("consultation_couldnt_join", locale)}</p>
        <p className="text-sm text-muted-foreground">{error.message}</p>
        {error.code === "PAYMENT_REQUIRED" && (
          <Button
            className="mt-2"
            nativeButton={false}
            render={<Link href={`/consultation/${appointmentId}/pay?mode=${initialMode}`} />}
          >
            {t("payment_complete_link", locale)}
          </Button>
        )}
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
        onReconnect={requestJoinInfo}
      />
    </main>
  );
}
