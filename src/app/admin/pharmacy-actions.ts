"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { actionErrorMessage, formString, requireAdmin } from "@/lib/admin/auth";
import type { createServiceClient } from "@/lib/supabase/service";

export type PharmacyActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

const PHARMACY_BUCKET = "pharmacy-items";
const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const VALID_STOCK_STATUSES = ["in_stock", "low_stock", "out_of_stock"];
const VALID_ITEM_STATUSES = ["published", "coming_soon", "hidden"];
const VALID_BADGES = ["trending", "hot", "new", "sale"];
const VALID_ORDER_STATUSES = [
  "pending",
  "preparing",
  "ready_for_pickup",
  "out_for_delivery",
  "delivered",
  "completed",
];

// Product photos are shown on the public catalog, so this bucket is public
// (unlike provider-applications, which needs signed URLs for private
// documents) -- a direct public URL is fine and simpler for a storefront.
// The bucket itself is provisioned by migration 0013, not at request time --
// runtime getBucket()/createBucket() round trips were slow and fragile
// (a Vercel function crash was traced to this) and every other bucket in
// this codebase (0007, 0010, 0011) is already migration-provisioned.
async function uploadPharmacyItemImage(
  service: ReturnType<typeof createServiceClient>,
  file: File
) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("Upload a JPG, PNG, or WebP image.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Image must be 6 MB or smaller.");
  }

  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${crypto.randomUUID()}.${extension}`;
  const bytes = await file.arrayBuffer();
  const { error: uploadError } = await service.storage
    .from(PHARMACY_BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: false });

  if (uploadError) {
    console.error("pharmacy image upload failed", uploadError);
    throw new Error(uploadError.message);
  }

  const { data } = service.storage.from(PHARMACY_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function revalidatePharmacySurfaces() {
  revalidatePath("/admin/dashboard");
  revalidatePath("/pharmacy");
}

export async function createPharmacyItem(
  _previousState: PharmacyActionState,
  formData: FormData
): Promise<PharmacyActionState> {
  try {
    const { adminUserId, service } = await requireAdmin();
    const medicineName = formString(formData, "medicineName");
    const category = formString(formData, "category");
    const description = formString(formData, "description");
    const form = formString(formData, "form");
    const strength = formString(formData, "strength");
    const unitPrice = Number(formString(formData, "unitPrice"));
    const stockStatus = formString(formData, "stockStatus") || "in_stock";
    const status = formString(formData, "status") || "published";
    const badgeField = formString(formData, "badge");
    const badge = badgeField === "none" ? "" : badgeField;
    const requiresPrescription = formData.get("requiresPrescription") === "on";
    const imageFile = formData.get("image");

    if (!medicineName || !category || !Number.isFinite(unitPrice) || unitPrice <= 0) {
      return {
        status: "error",
        message: "Medicine name, category, and a valid price are required.",
      };
    }

    if (badge && !VALID_BADGES.includes(badge)) {
      return { status: "error", message: "That badge isn't valid." };
    }

    let photoUrl: string | null = null;
    if (imageFile instanceof File && imageFile.size > 0) {
      photoUrl = await uploadPharmacyItemImage(service, imageFile);
    }

    const { data: item, error } = await service
      .from("pharmacy_items")
      .insert({
        medicine_name: medicineName,
        category,
        description: description || null,
        form: form || null,
        strength: strength || null,
        unit_price: unitPrice,
        stock_status: stockStatus,
        status,
        badge: badge || null,
        requires_prescription: requiresPrescription,
        photo_url: photoUrl,
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    await service.from("audit_logs").insert({
      actor_user_id: adminUserId,
      action: "pharmacy_item_added",
      entity_type: "pharmacy_item",
      entity_id: item.id,
      metadata_json: { medicineName, category, unitPrice },
    });

    revalidatePharmacySurfaces();

    return { status: "success", message: `${medicineName} added to the catalog.` };
  } catch (error) {
    unstable_rethrow(error);
    console.error("createPharmacyItem failed", error);
    return { status: "error", message: actionErrorMessage(error) };
  }
}

export async function updatePharmacyItem(
  _previousState: PharmacyActionState,
  formData: FormData
): Promise<PharmacyActionState> {
  try {
    const { adminUserId, service } = await requireAdmin();
    const itemId = formString(formData, "itemId");
    const medicineName = formString(formData, "medicineName");
    const category = formString(formData, "category");
    const description = formString(formData, "description");
    const form = formString(formData, "form");
    const strength = formString(formData, "strength");
    const unitPrice = Number(formString(formData, "unitPrice"));
    const stockStatus = formString(formData, "stockStatus");
    const status = formString(formData, "status");
    const badgeField = formString(formData, "badge");
    const badge = badgeField === "none" ? "" : badgeField;
    const requiresPrescription = formData.get("requiresPrescription") === "on";
    const removeImage = formData.get("removeImage") === "on";
    const imageFile = formData.get("image");

    if (
      !itemId ||
      !medicineName ||
      !category ||
      !Number.isFinite(unitPrice) ||
      unitPrice <= 0 ||
      !VALID_STOCK_STATUSES.includes(stockStatus) ||
      !VALID_ITEM_STATUSES.includes(status) ||
      (badge && !VALID_BADGES.includes(badge))
    ) {
      return {
        status: "error",
        message: "Medicine name, category, and a valid price are required.",
      };
    }

    const updates: Record<string, unknown> = {
      medicine_name: medicineName,
      category,
      description: description || null,
      form: form || null,
      strength: strength || null,
      unit_price: unitPrice,
      stock_status: stockStatus,
      status,
      badge: badge || null,
      requires_prescription: requiresPrescription,
    };

    if (imageFile instanceof File && imageFile.size > 0) {
      updates.photo_url = await uploadPharmacyItemImage(service, imageFile);
    } else if (removeImage) {
      updates.photo_url = null;
    }

    const { error } = await service.from("pharmacy_items").update(updates).eq("id", itemId);

    if (error) {
      throw new Error(error.message);
    }

    await service.from("audit_logs").insert({
      actor_user_id: adminUserId,
      action: "pharmacy_item_updated",
      entity_type: "pharmacy_item",
      entity_id: itemId,
      metadata_json: { medicineName, category, unitPrice },
    });

    revalidatePharmacySurfaces();

    return { status: "success", message: `${medicineName} updated.` };
  } catch (error) {
    unstable_rethrow(error);
    console.error("updatePharmacyItem failed", error);
    return { status: "error", message: actionErrorMessage(error) };
  }
}

export async function setPharmacyItemStatus(formData: FormData) {
  const { adminUserId, service } = await requireAdmin();
  const itemId = formString(formData, "itemId");
  const status = formString(formData, "status");

  if (!itemId || !VALID_ITEM_STATUSES.includes(status)) {
    throw new Error("Product and a valid status are required.");
  }

  const { data: item, error: fetchError } = await service
    .from("pharmacy_items")
    .select("id, medicine_name")
    .eq("id", itemId)
    .single();

  if (fetchError || !item) {
    throw new Error(fetchError?.message ?? "Product not found.");
  }

  const { error } = await service.from("pharmacy_items").update({ status }).eq("id", itemId);

  if (error) {
    throw new Error(error.message);
  }

  await service.from("audit_logs").insert({
    actor_user_id: adminUserId,
    action: "pharmacy_item_updated",
    entity_type: "pharmacy_item",
    entity_id: itemId,
    metadata_json: { medicineName: item.medicine_name, status },
  });

  revalidatePharmacySurfaces();
}

export async function deletePharmacyItem(formData: FormData) {
  const { adminUserId, service } = await requireAdmin();
  const itemId = formString(formData, "itemId");

  if (!itemId) {
    throw new Error("Product is required.");
  }

  const { data: item, error: itemError } = await service
    .from("pharmacy_items")
    .select("id, medicine_name")
    .eq("id", itemId)
    .single();

  if (itemError || !item) {
    throw new Error(itemError?.message ?? "Product not found.");
  }

  const { count: orderItemCount, error: countError } = await service
    .from("pharmacy_order_items")
    .select("id", { count: "exact", head: true })
    .eq("pharmacy_item_id", itemId);

  if (countError) {
    throw new Error(countError.message);
  }

  if ((orderItemCount ?? 0) > 0) {
    throw new Error("This product has order history. Hide it instead of deleting it.");
  }

  const { error } = await service.from("pharmacy_items").delete().eq("id", itemId);

  if (error) {
    throw new Error(error.message);
  }

  await service.from("audit_logs").insert({
    actor_user_id: adminUserId,
    action: "pharmacy_item_deleted",
    entity_type: "pharmacy_item",
    entity_id: itemId,
    metadata_json: { medicineName: item.medicine_name },
  });

  revalidatePharmacySurfaces();
}

export async function updatePharmacyOrderStatus(formData: FormData) {
  const { adminUserId, service } = await requireAdmin();
  const orderId = formString(formData, "orderId");
  const status = formString(formData, "status");

  if (!orderId || !VALID_ORDER_STATUSES.includes(status)) {
    throw new Error("Order and a valid status are required.");
  }

  const { data: order, error: fetchError } = await service
    .from("pharmacy_orders")
    .select("id, patients(hospital_reference_number)")
    .eq("id", orderId)
    .maybeSingle();

  if (fetchError || !order) {
    throw new Error(fetchError?.message ?? "Order not found.");
  }

  const { error } = await service.from("pharmacy_orders").update({ status }).eq("id", orderId);

  if (error) {
    throw new Error(error.message);
  }

  // patients is a many-to-one FK, so PostgREST embeds it as a single object.
  const patientReference = (
    order.patients as unknown as { hospital_reference_number: string } | null
  )?.hospital_reference_number;

  await service.from("audit_logs").insert({
    actor_user_id: adminUserId,
    action: "pharmacy_order_status_changed",
    entity_type: "pharmacy_order",
    entity_id: orderId,
    metadata_json: { patientReference, status },
  });

  revalidatePath("/admin/dashboard");
  revalidatePath("/account/dashboard");
}
