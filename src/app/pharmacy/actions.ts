"use server";

import { unstable_rethrow } from "next/navigation";
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

export type PlacePharmacyOrderResult = { ok: true; orderId: string } | { ok: false; message: string };

// Returns a result object rather than throwing -- a thrown Error from a
// Server Action never reaches the client's try/catch with a readable
// message in production (React error #441; see the same pattern in
// doctors/actions.ts's bookConsultationDirect and consultation/actions.ts's
// initiateSnippePayment).
export async function placePharmacyOrder(input: {
  lines: { itemId: string; quantity: number }[];
  fulfillmentMethod: FulfillmentMethod;
}): Promise<PlacePharmacyOrderResult> {
  try {
    const session = await getPatientSession();
    if (!session) {
      return { ok: false, message: "Your session expired. Please start the intake chat or look yourself up again." };
    }

    if (input.lines.length === 0) {
      return { ok: false, message: "Your cart is empty." };
    }

    const service = createServiceClient();
    const itemIds = input.lines.map((line) => line.itemId);

    const { data: items, error: itemsError } = await service
      .from("pharmacy_items")
      .select("id, medicine_name, unit_price, stock_status, requires_prescription, status")
      .in("id", itemIds)
      .returns<DbPharmacyItemRow[]>();

    if (itemsError) {
      return { ok: false, message: itemsError.message };
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
        return { ok: false, message: "One of the items in your cart is no longer available. Please review your cart." };
      }
      if (item.requires_prescription) {
        return {
          ok: false,
          message: `${item.medicine_name} requires a doctor-approved prescription and can't be ordered from the open catalog.`,
        };
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
      return { ok: false, message: "Your cart is empty." };
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
      return { ok: false, message: orderError?.message ?? "Could not place order." };
    }

    const orderId = order.id as string;

    const { error: itemsInsertError } = await service
      .from("pharmacy_order_items")
      .insert(orderItemRows.map((row) => ({ ...row, pharmacy_order_id: orderId })));

    if (itemsInsertError) {
      // Don't leave an order with no items behind.
      await service.from("pharmacy_orders").delete().eq("id", orderId);
      return { ok: false, message: itemsInsertError.message };
    }

    return { ok: true, orderId };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, message: error instanceof Error ? error.message : "Could not place your order." };
  }
}
