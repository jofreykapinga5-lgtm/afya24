"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { normalizeTanzanianPhoneToE164 } from "@/lib/phone";
import { getServerLocale } from "@/lib/locale-cookie";
import { t } from "@/lib/i18n";

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

  return { service, providerId: provider.id, userId: user.id };
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
  const phoneInput = String(formData.get("phone") ?? "").trim();
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

  const updates: { bio: string | null; phone: string | null; photo_url?: string } = {
    bio: bio || null,
    // Used for the patient-facing post-payment connect screen's phone-call
    // and WhatsApp options (src/app/consultation/[appointmentId]/connect) --
    // stored in E.164 so both tel: and wa.me links can build off it directly.
    phone: phoneInput ? normalizeTanzanianPhoneToE164(phoneInput) : null,
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
  const locale = await getServerLocale();
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
      message: t(availableNow ? "doctor_msg_visible_now" : "doctor_msg_set_offline", locale),
    };
  } catch (error) {
    unstable_rethrow(error);
    console.error("updateProviderAvailability failed", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : t("doctor_msg_avail_save_failed", locale),
    };
  }
}

// Self-service password change -- distinct from admin's resetProviderPassword
// (that one lets an admin reset a doctor's password on their behalf without
// knowing the old one). This requires the doctor to re-enter their current
// password first, verified via a real sign-in attempt, before Supabase Auth
// will let them set a new one.
export async function updateDoctorPassword(
  _previousState: AvailabilityActionState,
  formData: FormData
): Promise<AvailabilityActionState> {
  const locale = await getServerLocale();
  try {
    const currentPassword = String(formData.get("currentPassword") ?? "");
    const newPassword = String(formData.get("newPassword") ?? "");

    if (newPassword.length < 8) {
      return { status: "error", message: t("doctor_msg_password_min_length", locale) };
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      throw new Error("Not signed in.");
    }

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (verifyError) {
      return { status: "error", message: t("doctor_msg_password_incorrect", locale) };
    }

    const { userId } = await requireDoctorProvider();
    const service = createServiceClient();
    const { error } = await service.auth.admin.updateUserById(userId, { password: newPassword });

    if (error) {
      throw new Error(error.message);
    }

    return { status: "success", message: t("doctor_msg_password_updated", locale) };
  } catch (error) {
    unstable_rethrow(error);
    console.error("updateDoctorPassword failed", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : t("doctor_msg_password_update_failed", locale),
    };
  }
}

const EAT_OFFSET_MS = 3 * 60 * 60 * 1000; // Africa/Nairobi-style fixed UTC+3, no DST -- matches Afya24's only market.

export async function createAvailabilitySlot(formData: FormData) {
  const { service, providerId } = await requireDoctorProvider();
  const startTime = String(formData.get("startTime") ?? "");
  const endTime = String(formData.get("endTime") ?? "");
  const slotType = String(formData.get("slotType") ?? "available");
  const note = String(formData.get("note") ?? "").trim();

  if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
    throw new Error("Start time and end time are required.");
  }
  if (!["available", "break", "time_off"].includes(slotType)) {
    throw new Error("A valid type is required.");
  }

  // Doctors set this every day, for today only -- asking them to also pick
  // a date turned into the actual source of bad entries (ranges that
  // silently crossed midnight backwards, e.g. "14:59 to 3:59"). Today's date
  // is always Tanzania's calendar day, not the server's, hence the fixed
  // offset rather than `new Date()` directly.
  const todayEat = new Date(Date.now() + EAT_OFFSET_MS).toISOString().slice(0, 10);
  const startsAt = new Date(`${todayEat}T${startTime}:00+03:00`);
  const endsAt = new Date(`${todayEat}T${endTime}:00+03:00`);

  if (endsAt.getTime() <= startsAt.getTime()) {
    throw new Error("End time must be after the start time. For an overnight window, add it as two entries.");
  }
  if (endsAt.getTime() < Date.now()) {
    throw new Error("This time has already passed today.");
  }

  const { error } = await service.from("provider_availability_slots").insert({
    provider_id: providerId,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
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

export type JoinAppointmentResult = { ok: true } | { ok: false; message: string };

// "Joining is accepting" -- a single step, no separate accept/decline. This
// still has to move the appointment out of 'waiting' or the queue would
// never empty even after a call happens; nothing else in the app makes that
// transition.
// Returns a result object instead of redirecting -- the doctor now joins a
// call inline on the dashboard (see DoctorVideoQueue + call-panel.tsx)
// rather than navigating to the full-screen /consultation page, so there's
// nowhere to redirect *to* anymore. A thrown error also wouldn't reliably
// reach the client here (see initiateSnippePayment's comment on the same
// issue in src/app/consultation/actions.ts).
export async function joinWaitingAppointment(appointmentId: string): Promise<JoinAppointmentResult> {
  try {
    const { service, providerId } = await requireDoctorProvider();

    if (!appointmentId) {
      return { ok: false, message: "Appointment id is required." };
    }

    const { error } = await service
      .from("appointments")
      .update({ status: "in_progress" })
      .eq("id", appointmentId)
      .eq("provider_id", providerId)
      .eq("status", "waiting");

    if (error) {
      return { ok: false, message: error.message };
    }

    return { ok: true };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, message: error instanceof Error ? error.message : "Could not join the call." };
  }
}

// Autosaved from the dashboard's embedded call panel while a doctor writes
// notes during/after a consultation -- see migration 0017. Scoped to
// providerId the same way every other doctor action here is, so a doctor
// can only write notes on their own appointments.
export async function saveDoctorNotes(
  appointmentId: string,
  notes: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const { service, providerId } = await requireDoctorProvider();

    const { error } = await service
      .from("appointments")
      .update({ doctor_notes: notes })
      .eq("id", appointmentId)
      .eq("provider_id", providerId);

    if (error) {
      return { ok: false, message: error.message };
    }

    return { ok: true };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, message: error instanceof Error ? error.message : "Could not save notes." };
  }
}

// Called when the doctor closes the embedded call panel (see call-panel.tsx).
// Without this, an appointment stays 'in_progress' forever once joined --
// nothing else ever moves it to 'completed' -- which would permanently block
// the patient-side queue countdown (src/app/api/video/room/route.ts) from
// ever seeing this doctor as free again for the next waiting patient.
export async function endDoctorCall(appointmentId: string): Promise<JoinAppointmentResult> {
  try {
    const { service, providerId } = await requireDoctorProvider();

    if (!appointmentId) {
      return { ok: false, message: "Appointment id is required." };
    }

    const { error } = await service
      .from("appointments")
      .update({ status: "completed" })
      .eq("id", appointmentId)
      .eq("provider_id", providerId)
      .eq("status", "in_progress");

    if (error) {
      return { ok: false, message: error.message };
    }

    await service
      .from("video_sessions")
      .update({ status: "ended", ended_at: new Date().toISOString() })
      .eq("appointment_id", appointmentId);

    return { ok: true };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, message: error instanceof Error ? error.message : "Could not end the call." };
  }
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/doctor");
}
