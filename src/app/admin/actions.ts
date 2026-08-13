"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { ProviderStatus } from "@/lib/types";

export type AdminActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

function actionErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/doctor");
  }

  const service = createServiceClient();
  const { data: profile, error } = await service
    .from("users")
    .select("id, role, status")
    .eq("id", user.id)
    .maybeSingle();

  if (error || profile?.role !== "admin" || profile.status !== "active") {
    redirect("/doctor/dashboard");
  }

  return { adminUserId: user.id, service };
}

function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function formModes(formData: FormData) {
  const modes = formData
    .getAll("consultationModes")
    .map(String)
    .filter((mode) => mode === "voice" || mode === "video");
  return modes.length > 0 ? modes : ["voice", "video"];
}

export async function createProviderAccount(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  try {
    const { adminUserId, service } = await requireAdmin();
    const email = formString(formData, "email").toLowerCase();
    const password = String(formData.get("password") ?? "");
    const fullName = formString(formData, "fullName");
    const phone = formString(formData, "phone");
    const specialty = formString(formData, "specialty");
    const licenseNumber = formString(formData, "licenseNumber");
    const credentials = formString(formData, "credentials");
    const bio = formString(formData, "bio");
    const languages = formData.getAll("languages").map(String);
    const consultationModes = formModes(formData);

    if (!email || !password || !fullName || !specialty || !licenseNumber) {
      return {
        status: "error",
        message: "Email, password, full name, specialty, and license number are required.",
      };
    }

    const { data: created, error: createError } = await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: "doctor",
      },
    });

    if (createError || !created.user) {
      throw new Error(createError?.message ?? "Could not create provider auth account.");
    }

    const { error: userError } = await service.from("users").insert({
      id: created.user.id,
      email,
      phone: phone || null,
      role: "doctor",
      status: "invited",
    });

    if (userError) {
      await service.auth.admin.deleteUser(created.user.id);
      throw new Error(userError.message);
    }

    const { data: provider, error: providerError } = await service
      .from("providers")
      .insert({
        user_id: created.user.id,
        full_name: fullName,
        specialty,
        license_number: licenseNumber,
        credentials: credentials || null,
        bio: bio || null,
        profile_status: "pending",
        languages: languages.length > 0 ? languages : ["sw", "en"],
        consultation_modes: consultationModes,
        available_now: false,
        availability_note: "Account created by admin. Waiting for approval.",
      })
      .select("id")
      .single();

    if (providerError) {
      await service.from("users").delete().eq("id", created.user.id);
      await service.auth.admin.deleteUser(created.user.id);
      throw new Error(providerError.message);
    }

    await service.from("audit_logs").insert({
      actor_user_id: adminUserId,
      action: "provider_added",
      entity_type: "provider",
      entity_id: provider.id,
      metadata_json: { fullName, email, specialty, licenseNumber },
    });

    revalidatePath("/admin/dashboard");

    return {
      status: "success",
      message: `${fullName} was created as a pending doctor. Activate them when their details are verified.`,
    };
  } catch (error) {
    unstable_rethrow(error);

    return {
      status: "error",
      message: actionErrorMessage(error),
    };
  }
}

export async function updateProviderStatus(formData: FormData) {
  const { adminUserId, service } = await requireAdmin();
  const providerId = formString(formData, "providerId");
  const status = formString(formData, "status") as ProviderStatus;

  if (!providerId || !["active", "pending", "suspended"].includes(status)) {
    throw new Error("Invalid provider status request.");
  }

  const { data: provider, error: providerError } = await service
    .from("providers")
    .select("id, user_id, full_name")
    .eq("id", providerId)
    .single();

  if (providerError || !provider) {
    throw new Error(providerError?.message ?? "Provider not found.");
  }

  const userStatus = status === "active" ? "active" : status === "suspended" ? "suspended" : "invited";

  const { error } = await service
    .from("providers")
    .update({ profile_status: status })
    .eq("id", providerId);

  if (error) {
    throw new Error(error.message);
  }

  const { error: userError } = await service
    .from("users")
    .update({ status: userStatus })
    .eq("id", provider.user_id);

  if (userError) {
    throw new Error(userError.message);
  }

  await service.from("audit_logs").insert({
    actor_user_id: adminUserId,
    action: "provider_status_changed",
    entity_type: "provider",
    entity_id: providerId,
    metadata_json: { fullName: provider.full_name, status },
  });

  revalidatePath("/admin/dashboard");
  revalidatePath("/doctors");
}

export async function updateProviderAvailabilityByAdmin(formData: FormData) {
  const { adminUserId, service } = await requireAdmin();
  const providerId = formString(formData, "providerId");
  const availableNow = formData.get("availableNow") === "on";
  const availabilityNote = formString(formData, "availabilityNote");
  const consultationModes = formModes(formData);

  if (!providerId) {
    throw new Error("Provider is required.");
  }

  const { data: provider, error: providerError } = await service
    .from("providers")
    .select("id, full_name")
    .eq("id", providerId)
    .single();

  if (providerError || !provider) {
    throw new Error(providerError?.message ?? "Provider not found.");
  }

  const { error } = await service
    .from("providers")
    .update({
      available_now: availableNow,
      availability_note: availabilityNote || null,
      consultation_modes: consultationModes,
    })
    .eq("id", providerId);

  if (error) {
    throw new Error(error.message);
  }

  await service.from("audit_logs").insert({
    actor_user_id: adminUserId,
    action: "provider_status_changed",
    entity_type: "provider",
    entity_id: providerId,
    metadata_json: { fullName: provider.full_name, availableNow },
  });

  revalidatePath("/");
  revalidatePath("/admin/dashboard");
  revalidatePath("/account/dashboard");
  revalidatePath("/doctors");
}

export async function resetProviderPassword(formData: FormData) {
  const { adminUserId, service } = await requireAdmin();
  const providerId = formString(formData, "providerId");
  const password = String(formData.get("password") ?? "");

  if (!providerId || password.length < 8) {
    throw new Error("Provider and a password of at least 8 characters are required.");
  }

  const { data: provider, error: providerError } = await service
    .from("providers")
    .select("id, user_id, full_name")
    .eq("id", providerId)
    .single();

  if (providerError || !provider) {
    throw new Error(providerError?.message ?? "Provider not found.");
  }

  const { error } = await service.auth.admin.updateUserById(provider.user_id, {
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  await service.from("audit_logs").insert({
    actor_user_id: adminUserId,
    action: "provider_status_changed",
    entity_type: "provider",
    entity_id: providerId,
    metadata_json: { fullName: provider.full_name, accessReset: true },
  });

  revalidatePath("/admin/dashboard");
}

export async function deleteProviderAccount(formData: FormData) {
  const { adminUserId, service } = await requireAdmin();
  const providerId = formString(formData, "providerId");

  if (!providerId) {
    throw new Error("Provider is required.");
  }

  const { data: provider, error: providerError } = await service
    .from("providers")
    .select("id, user_id, full_name")
    .eq("id", providerId)
    .single();

  if (providerError || !provider) {
    throw new Error(providerError?.message ?? "Provider not found.");
  }

  const { count: appointmentCount, error: appointmentError } = await service
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("provider_id", providerId);

  if (appointmentError) {
    throw new Error(appointmentError.message);
  }

  if ((appointmentCount ?? 0) > 0) {
    throw new Error("This doctor has session history. Disable the doctor instead of deleting them.");
  }

  const { error: deleteProviderError } = await service
    .from("providers")
    .delete()
    .eq("id", providerId);

  if (deleteProviderError) {
    throw new Error(deleteProviderError.message);
  }

  const { error: deleteUserError } = await service.auth.admin.deleteUser(provider.user_id);

  if (deleteUserError) {
    throw new Error(deleteUserError.message);
  }

  await service.from("audit_logs").insert({
    actor_user_id: adminUserId,
    action: "provider_status_changed",
    entity_type: "provider",
    entity_id: providerId,
    metadata_json: { fullName: provider.full_name, deleted: true },
  });

  revalidatePath("/admin/dashboard");
  revalidatePath("/doctors");
}

async function setAppointmentPaymentStatus(
  formData: FormData,
  status: "paid" | "failed",
  auditAction: "payment_confirmed" | "payment_marked_failed"
) {
  const { adminUserId, service } = await requireAdmin();
  const appointmentId = formString(formData, "appointmentId");

  if (!appointmentId) {
    throw new Error("Appointment is required.");
  }

  const { data: appointment, error: fetchError } = await service
    .from("appointments")
    .select("id, patients(hospital_reference_number)")
    .eq("id", appointmentId)
    .maybeSingle();

  if (fetchError || !appointment) {
    throw new Error(fetchError?.message ?? "Appointment not found.");
  }

  const { error } = await service
    .from("appointments")
    .update({ payment_status: status })
    .eq("id", appointmentId);

  if (error) {
    throw new Error(error.message);
  }

  // patients is a genuine many-to-one FK (appointments.patient_id -> patients.id)
  // and PostgREST embeds it as a single object -- confirmed against the real
  // API response, not just the untyped client's generic inferred shape.
  const patientReference = (
    appointment.patients as unknown as { hospital_reference_number: string } | null
  )?.hospital_reference_number;

  await service.from("audit_logs").insert({
    actor_user_id: adminUserId,
    action: auditAction,
    entity_type: "appointment",
    entity_id: appointmentId,
    metadata_json: { patientReference },
  });

  revalidatePath("/admin/dashboard");
}

export async function confirmAppointmentPayment(formData: FormData) {
  await setAppointmentPaymentStatus(formData, "paid", "payment_confirmed");
}

export async function markAppointmentPaymentFailed(formData: FormData) {
  await setAppointmentPaymentStatus(formData, "failed", "payment_marked_failed");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/doctor");
}
