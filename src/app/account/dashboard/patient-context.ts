import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { redirectIfStaffUser } from "@/lib/staff-redirect-guard";

export type PatientRow = {
  id: string;
  full_name: string;
  hospital_reference_number: string | null;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
};

// Shared by layout.tsx and every page under /account/dashboard -- wrapped in
// React's cache() so the auth + patient-row lookup only hits Supabase once
// per request even though the layout and the active page each call it
// independently (there's no other way to hand data from a layout down to a
// page in the App Router). Mirrors doctor/dashboard/doctor-context.ts.
export const getPatientDashboardContext = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/account");
  }

  await redirectIfStaffUser(user.id);

  const { data: patient } = await supabase
    .from("patients")
    .select("id, full_name, hospital_reference_number, phone, date_of_birth, gender")
    .eq("user_id", user.id)
    .maybeSingle<PatientRow>();

  return { user, patient, supabase };
});
