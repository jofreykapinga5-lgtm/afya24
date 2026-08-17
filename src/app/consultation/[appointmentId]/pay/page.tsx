import { redirect } from "next/navigation";
import { getServerLocale } from "@/lib/locale-cookie";
import { getPatientSession } from "@/lib/patient-session";
import { createServiceClient } from "@/lib/supabase/service";
import { Reveal } from "@/components/motion/reveal";
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
    .select("id, patient_id, price, currency, payment_status, providers(full_name, specialty)")
    .eq("id", appointmentId)
    .maybeSingle<AppointmentRow>();

  if (!appointment || appointment.patient_id !== session.patientId) {
    redirect("/qualification");
  }

  if (appointment.payment_status === "paid") {
    redirect(`/consultation/${appointmentId}/connect`);
  }

  const { data: patient } = await service
    .from("patients")
    .select("phone, hospital_reference_number")
    .eq("id", session.patientId)
    .maybeSingle();

  return (
    <main className="flex min-h-[calc(100dvh-3.5rem)] flex-1 flex-col justify-center bg-[#f7fbfb] px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <Reveal>
          <PayForm
            appointmentId={appointmentId}
            locale={locale}
            price={Number(appointment.price)}
            currency={appointment.currency}
            providerName={appointment.providers?.full_name ?? ""}
            specialty={appointment.providers?.specialty ?? ""}
            defaultPhone={patient?.phone ?? ""}
            hospitalReferenceNumber={patient?.hospital_reference_number ?? ""}
          />
        </Reveal>
      </div>
    </main>
  );
}
