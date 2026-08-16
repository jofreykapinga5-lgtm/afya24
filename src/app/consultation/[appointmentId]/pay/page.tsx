import { redirect } from "next/navigation";
import { getServerLocale } from "@/lib/locale-cookie";
import { getPatientSession } from "@/lib/patient-session";
import { createServiceClient } from "@/lib/supabase/service";
import { PayForm } from "./pay-form";

type AppointmentRow = {
  id: string;
  patient_id: string;
  price: number | string;
  currency: string;
  payment_status: string;
  providers: { full_name: string; specialty: string } | null;
};

export default async function ConsultationPaymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ appointmentId: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { appointmentId } = await params;
  const { mode } = await searchParams;
  const locale = await getServerLocale();
  const session = await getPatientSession();

  if (!session) {
    redirect("/qualification");
  }

  const service = createServiceClient();
  const { data: appointment } = await service
    .from("appointments")
    .select("id, patient_id, price, currency, payment_status, providers(full_name, specialty)")
    .eq("id", appointmentId)
    .maybeSingle<AppointmentRow>();

  if (!appointment || appointment.patient_id !== session.patientId) {
    redirect("/qualification");
  }

  const callMode = mode === "voice" ? "voice" : "video";

  if (appointment.payment_status === "paid") {
    redirect(`/consultation/${appointmentId}?mode=${callMode}`);
  }

  const { data: patient } = await service
    .from("patients")
    .select("phone")
    .eq("id", session.patientId)
    .maybeSingle();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
      <PayForm
        appointmentId={appointmentId}
        mode={callMode}
        locale={locale}
        price={Number(appointment.price)}
        currency={appointment.currency}
        providerName={appointment.providers?.full_name ?? ""}
        specialty={appointment.providers?.specialty ?? ""}
        defaultPhone={patient?.phone ?? ""}
      />
    </main>
  );
}
