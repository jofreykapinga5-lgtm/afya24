"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { getPatientSession } from "@/lib/patient-session";
import type { FulfillmentMethod } from "@/lib/types";

const DELIVERY_FEE = 150;

type DbPharmacyItemRow = {
  id: string;
  medicine_name: string;
  unit_price: number | string;
  stock_status: string;
  requires_prescription: boolean;
  status: string;
};

export async function placePharmacyOrder(input: {
  lines: { itemId: string; quantity: number }[];
  fulfillmentMethod: FulfillmentMethod;
}): Promise<string> {
  const session = await getPatientSession();
  if (!session) {
    throw new Error("Your session expired. Please start the intake chat or look yourself up again.");
  }

  if (input.lines.length === 0) {
    throw new Error("Your cart is empty.");
  }

  const service = createServiceClient();
  const itemIds = input.lines.map((line) => line.itemId);

  const { data: items, error: itemsError } = await service
    .from("pharmacy_items")
    .select("id, medicine_name, unit_price, stock_status, requires_prescription, status")
    .in("id", itemIds)
    .returns<DbPharmacyItemRow[]>();

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  const itemById = new Map((items ?? []).map((item) => [item.id, item]));

  // Recompute everything from the database at submission time -- never
  // trust client-supplied prices, and re-check availability/prescription
  // rules in case a product changed between browsing and checkout.
  let subtotal = 0;
  const orderItemRows: {
    pharmacy_item_id: string;
    prescribed_medication_name: string;
    quantity: number;
    availability_status: string;
    substitution_requested: boolean;
    doctor_approval_required: boolean;
  }[] = [];

  for (const line of input.lines) {
    const item = itemById.get(line.itemId);
    if (!item || item.status !== "published") {
      throw new Error("One of the items in your cart is no longer available. Please review your cart.");
    }
    if (item.requires_prescription) {
      throw new Error(
        `${item.medicine_name} requires a doctor-approved prescription and can't be ordered from the open catalog.`
      );
    }
    if (line.quantity < 1) {
      continue;
    }

    subtotal += Number(item.unit_price) * line.quantity;
    orderItemRows.push({
      pharmacy_item_id: item.id,
      prescribed_medication_name: item.medicine_name,
      quantity: line.quantity,
      availability_status: item.stock_status,
      substitution_requested: false,
      doctor_approval_required: false,
    });
  }

  if (orderItemRows.length === 0) {
    throw new Error("Your cart is empty.");
  }

  const fees = input.fulfillmentMethod === "delivery" ? DELIVERY_FEE : 0;
  const total = subtotal + fees;

  const { data: order, error: orderError } = await service
    .from("pharmacy_orders")
    .insert({
      patient_id: session.patientId,
      status: "pending",
      fulfillment_method: input.fulfillmentMethod,
      payment_status: "pending",
      total_amount: total,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    throw new Error(orderError?.message ?? "Could not place order.");
  }

  const orderId = order.id as string;

  const { error: itemsInsertError } = await service
    .from("pharmacy_order_items")
    .insert(orderItemRows.map((row) => ({ ...row, pharmacy_order_id: orderId })));

  if (itemsInsertError) {
    // Don't leave an order with no items behind.
    await service.from("pharmacy_orders").delete().eq("id", orderId);
    throw new Error(itemsInsertError.message);
  }

  return orderId;
}
