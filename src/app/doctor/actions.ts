"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export type AvailabilityActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const requestedRedirectTo = String(formData.get("redirectTo") || "/doctor/dashboard");
  const loginPath = "/doctor?";

  let data;
  let authErrorMessage: string | null = null;
  try {
    const supabase = await createClient();
    const result = await supabase.auth.signInWithPassword({ email, password });
    data = result.data;

    if (result.error) {
      authErrorMessage = result.error.message;
    }
  } catch {
    const params = new URLSearchParams({
      error:
        "Could not reach Afya24 authentication. Check Supabase environment variables on Vercel and try again.",
      redirectTo: requestedRedirectTo,
    });
    redirect(`${loginPath}${params.toString()}`);
  }

  if (authErrorMessage) {
    const params = new URLSearchParams({ error: authErrorMessage, redirectTo: requestedRedirectTo });
    redirect(`${loginPath}${params.toString()}`);
  }

  const userId = data.user?.id;
  if (!userId) {
    const params = new URLSearchParams({
      error: "Signed in, but staff profile could not be verified.",
      redirectTo: requestedRedirectTo,
    });
    redirect(`${loginPath}${params.toString()}`);
  }

  let profile: { role: string } | null = null;
  try {
    const service = createServiceClient();
    const { data: staffProfile, error: profileError } = await service
      .from("users")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    profile = staffProfile;
  } catch {
    const params = new URLSearchParams({
      error:
        "Signed in, but staff profile lookup failed. Check SUPABASE_SERVICE_ROLE_KEY on Vercel.",
      redirectTo: requestedRedirectTo,
    });
    redirect(`${loginPath}${params.toString()}`);
  }

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
  const modes = formData
    .getAll("consultationModes")
    .map(String)
    .filter((mode) => mode === "voice" || mode === "video");
  return modes.length > 0 ? modes : ["voice", "video"];
}

function imageExtension(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

export async function updateDoctorPublicProfile(formData: FormData) {
  const { service, providerId } = await requireDoctorProvider();
  const bio = String(formData.get("bio") ?? "").trim();
  const image = formData.get("image");
  let photoUrl: string | null = null;

  if (image instanceof File && image.size > 0) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(image.type)) {
      throw new Error("Upload a JPG, PNG, or WebP image.");
    }

    if (image.size > 5 * 1024 * 1024) {
      throw new Error("Keep the profile image under 5 MB.");
    }

    const extension = imageExtension(image.type);
    const path = `${providerId}/${Date.now()}.${extension}`;
    const { error: uploadError } = await service.storage
      .from("provider-profile-images")
      .upload(path, image, {
        contentType: image.type,
        upsert: true,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = service.storage.from("provider-profile-images").getPublicUrl(path);
    photoUrl = data.publicUrl;
  }

  const updates: { bio: string | null; photo_url?: string } = {
    bio: bio || null,
  };

  if (photoUrl) {
    updates.photo_url = photoUrl;
  }

  const { error } = await service.from("providers").update(updates).eq("id", providerId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/doctor/dashboard");
  revalidatePath("/doctors");
  revalidatePath("/doctors/[providerId]", "page");
}

export async function updateProviderAvailability(
  _previousState: AvailabilityActionState,
  formData: FormData
): Promise<AvailabilityActionState> {
  try {
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

    // Also revalidate "/" (missed previously): the home page's doctor
    // preview reads the same providers rows, so it would keep showing a
    // doctor as away/online after they'd just toggled it here.
    revalidatePath("/");
    revalidatePath("/doctor/dashboard");
    revalidatePath("/doctors");
    revalidatePath("/doctors/[providerId]", "page");

    return {
      status: "success",
      message: availableNow ? "You're visible to patients now." : "You're set to offline.",
    };
  } catch (error) {
    unstable_rethrow(error);
    console.error("updateProviderAvailability failed", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Could not save availability. Try again.",
    };
  }
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

  // The datetime pickers already floor at "now" client-side, but that's
  // only a browser-native guard -- enforce it here too since a slot dated
  // in the past would just silently never show up on the storefront (which
  // only ever queries upcoming slots), with no obvious signal to the doctor
  // about why.
  if (new Date(startsAt).getTime() < Date.now()) {
    throw new Error("Start time can't be in the past.");
  }

  if (new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
    throw new Error("End time must be after the start time.");
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
