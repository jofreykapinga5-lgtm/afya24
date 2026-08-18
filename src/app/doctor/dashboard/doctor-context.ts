import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export type ProviderRow = {
  id: string;
  full_name: string;
  specialty: string;
  bio: string | null;
  photo_url: string | null;
  phone: string | null;
  profile_status: string;
  available_now?: boolean | null;
  availability_note?: string | null;
  consultation_modes?: string[] | null;
};

// Shared by layout.tsx and every page under /doctor/dashboard -- wrapped in
// React's cache() so the auth + profile + provider lookup only hits the DB
// once per request even though the layout and the active page each call it
// independently (there's no other way to hand data from a layout down to a
// page in the App Router).
export const getDoctorDashboardContext = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/doctor");
  }

  const service = createServiceClient();
  const { data: profile } = await service
    .from("users")
    .select("role, status")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role === "admin") {
    redirect("/admin/dashboard");
  }

  if (profile && profile.role !== "doctor") {
    redirect("/");
  }

  const { data: provider } = profile?.role === "doctor"
    ? await service
        .from("providers")
        .select("id, full_name, specialty, bio, photo_url, phone, profile_status, available_now, availability_note, consultation_modes")
        .eq("user_id", user.id)
        .maybeSingle<ProviderRow>()
    : { data: null };

  const canManageAvailability =
    profile?.role === "doctor" && profile.status === "active" && provider?.profile_status === "active";

  return { user, profile, provider, canManageAvailability, service };
});
