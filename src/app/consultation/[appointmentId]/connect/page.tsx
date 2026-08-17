import { redirect } from "next/navigation";
import { getServerLocale } from "@/lib/locale-cookie";
import { getPatientSession } from "@/lib/patient-session";
import { createServiceClient } from "@/lib/supabase/service";
import { Reveal } from "@/components/motion/reveal";
import { ConnectOptions } from "./connect-options";

type AppointmentRow = {
  id: string;
  patient_id: string;
  payment_status: string;
  providers: {
    full_name: string;
    specialty: string;
    phone: string | null;
    consultation_modes: string[] | null;
  } | null;
};

// The patient only reaches here after a confirmed payment (see pay/page.tsx)
// -- this is where they finally pick HOW to talk to the doctor, not just
// that they're paying for the right to. In-app voice/video go through
// LiveKit as before; phone call and WhatsApp bypass the app entirely and
// hand off to the doctor's real number, so this is also the first screen
// that needs that number to exist at all.
export default async function ConnectPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const { appointmentId } = await params;
  const locale = await getServerLocale();
  const session = await getPatientSession();

  if (!session) {
    redirect("/qualification");
  }

  const service = createServiceClient();
  const { data: appointment } = await service
    .from("appointments")
    .select("id, patient_id, payment_status, providers(full_name, specialty, phone, consultation_modes)")
    .eq("id", appointmentId)
    .maybeSingle<AppointmentRow>();

  if (!appointment || appointment.patient_id !== session.patientId) {
    redirect("/qualification");
  }

  if (appointment.payment_status !== "paid") {
    redirect(`/consultation/${appointmentId}/pay`);
  }

  const provider = appointment.providers;
  const modes = provider?.consultation_modes ?? [];

  return (
    <main className="flex min-h-[calc(100dvh-3.5rem)] flex-1 flex-col justify-center bg-[#f7fbfb] px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <Reveal>
          <ConnectOptions
            appointmentId={appointmentId}
            locale={locale}
            providerName={provider?.full_name ?? ""}
            canVoice={modes.includes("voice")}
            canVideo={modes.includes("video")}
            providerPhone={provider?.phone ?? null}
          />
        </Reveal>
      </div>
    </main>
  );
}
