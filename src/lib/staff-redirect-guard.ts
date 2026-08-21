import "server-only";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";

// Patients and staff (doctors, admins, pharmacy/lab staff) all authenticate
// through the same Supabase Auth, but the patient-facing /account pages
// never checked which kind of user was actually signed in -- a staff member
// with an active doctor/admin session who landed here (e.g. clicking the
// top-nav "Login", which is meant to be patient-only) was silently treated
// as a patient instead of being sent to their real dashboard, since
// /account/dashboard's own patient lookup just came back empty for them.
// Call this right after confirming a Supabase Auth user exists on any
// /account* page.
export async function redirectIfStaffUser(userId: string) {
  const service = createServiceClient();
  const { data: profile } = await service.from("users").select("role").eq("id", userId).maybeSingle();

  if (profile?.role === "doctor") {
    redirect("/doctor/dashboard");
  }
  if (profile?.role === "admin") {
    redirect("/admin/dashboard");
  }
  if (profile?.role === "pharmacy_staff" || profile?.role === "lab_staff") {
    redirect("/");
  }
}
