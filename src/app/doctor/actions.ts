"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const requestedRedirectTo = String(formData.get("redirectTo") || "/doctor/dashboard");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const params = new URLSearchParams({ error: error.message, redirectTo: requestedRedirectTo });
    redirect(`/doctor?${params.toString()}`);
  }

  const userId = data.user?.id;
  if (!userId) {
    const params = new URLSearchParams({
      error: "Signed in, but staff profile could not be verified.",
      redirectTo: requestedRedirectTo,
    });
    redirect(`/doctor?${params.toString()}`);
  }

  const service = createServiceClient();
  const { data: profile } = await service
    .from("users")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.role === "admin") {
    redirect("/admin/dashboard");
  }

  if (profile?.role === "doctor") {
    redirect("/doctor/dashboard");
  }

  redirect("/doctor");
}

async function requireDoctorProvider() {
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
    .select("id, role, status")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role === "admin") {
    redirect("/admin/dashboard");
  }

  if (profile?.role !== "doctor" || profile.status !== "active") {
    redirect("/doctor");
  }

  const { data: provider, error } = await service
    .from("providers")
    .select("id")
    .eq("user_id", user.id)
    .eq("profile_status", "active")
    .maybeSingle();

  if (error || !provider) {
    throw new Error("Active provider profile not found.");
  }

  return { service, providerId: provider.id };
}

function selectedModes(formData: FormData) {
  const modes = formData.getAll("consultationModes").map(String);
  return modes.length > 0 ? modes : ["chat", "voice", "video"];
}

export async function updateProviderAvailability(formData: FormData) {
  const { service, providerId } = await requireDoctorProvider();
  const availableNow = formData.get("availableNow") === "on";
  const availabilityNote = String(formData.get("availabilityNote") ?? "").trim();

  const { error } = await service
    .from("providers")
    .update({
      available_now: availableNow,
      availability_note: availabilityNote || null,
      consultation_modes: selectedModes(formData),
    })
    .eq("id", providerId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/doctor/dashboard");
  revalidatePath("/doctors");
}

export async function createAvailabilitySlot(formData: FormData) {
  const { service, providerId } = await requireDoctorProvider();
  const startsAt = String(formData.get("startsAt") ?? "");
  const endsAt = String(formData.get("endsAt") ?? "");
  const slotType = String(formData.get("slotType") ?? "available");
  const note = String(formData.get("note") ?? "").trim();

  if (!startsAt || !endsAt || !["available", "break", "time_off"].includes(slotType)) {
    throw new Error("Start, end, and slot type are required.");
  }

  const { error } = await service.from("provider_availability_slots").insert({
    provider_id: providerId,
    starts_at: new Date(startsAt).toISOString(),
    ends_at: new Date(endsAt).toISOString(),
    slot_type: slotType,
    status: slotType === "available" ? "open" : "cancelled",
    consultation_modes: selectedModes(formData),
    note: note || null,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/doctor/dashboard");
  revalidatePath("/doctors");
}

export async function cancelAvailabilitySlot(formData: FormData) {
  const { service, providerId } = await requireDoctorProvider();
  const slotId = String(formData.get("slotId") ?? "");

  if (!slotId) {
    throw new Error("Slot id is required.");
  }

  const { error } = await service
    .from("provider_availability_slots")
    .update({ status: "cancelled" })
    .eq("id", slotId)
    .eq("provider_id", providerId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/doctor/dashboard");
  revalidatePath("/doctors");
}

// "Joining is accepting" -- a single step, no separate accept/decline. This
// still has to move the appointment out of 'waiting' or the queue would
// never empty even after a call happens; nothing else in the app makes that
// transition.
export async function joinWaitingAppointment(formData: FormData) {
  const { service, providerId } = await requireDoctorProvider();
  const appointmentId = String(formData.get("appointmentId") ?? "");
  const mode = String(formData.get("mode") ?? "video");

  if (!appointmentId) {
    throw new Error("Appointment id is required.");
  }

  const { error } = await service
    .from("appointments")
    .update({ status: "in_progress" })
    .eq("id", appointmentId)
    .eq("provider_id", providerId)
    .eq("status", "waiting");

  if (error) {
    throw new Error(error.message);
  }

  redirect(`/consultation/${appointmentId}?mode=${mode}`);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/doctor");
}
