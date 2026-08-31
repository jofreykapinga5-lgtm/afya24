"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Package, TriangleAlert, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PharmacyProductTile } from "@/components/pharmacy-category-icon";
import { PharmacyStatusStepper } from "@/components/pharmacy-status-stepper";
import { placePharmacyOrder } from "@/app/pharmacy/actions";
import { useAppStore } from "@/lib/store";
import type { FulfillmentMethod, Locale, PharmacyItem } from "@/lib/types";
import { t } from "@/lib/i18n";

const DELIVERY_FEE = 150;

export function PharmacyCheckoutClient({
  locale,
  items,
  hasSession,
}: {
  locale: Locale;
  items: PharmacyItem[];
  hasSession: boolean;
}) {
  const cart = useAppStore((state) => state.pharmacyCart);
  const clearCart = useAppStore((state) => state.clearPharmacyCart);
  const [fulfillment, setFulfillment] = useState<FulfillmentMethod>("pickup");
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const cartLines = cart
    .map((line) => ({ line, item: items.find((item) => item.id === line.itemId) }))
    .filter((entry) => entry.item);
  const subtotal = cartLines.reduce(
    (sum, entry) => sum + (entry.item?.unitPrice ?? 0) * entry.line.quantity,
    0
  );
  const fees = fulfillment === "delivery" ? DELIVERY_FEE : 0;
  const total = subtotal + fees;

  function handlePlaceOrder() {
    setError(null);
    startTransition(async () => {
      const result = await placePharmacyOrder({
        lines: cartLines.map(({ line }) => ({ itemId: line.itemId, quantity: line.quantity })),
        fulfillmentMethod: fulfillment,
      });
      if (result.ok) {
        clearCart();
        setPlacedOrderId(result.orderId);
      } else {
        setError(result.message || "Could not place your order. Please try again.");
      }
    });
  }

  if (placedOrderId) {
    return (
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-14 sm:px-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="inline-flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <Check className="size-6" />
          </span>
          <h1 className="text-xl font-semibold">{t("checkout_order_placed", locale)}</h1>
          <p className="text-sm text-muted-foreground">{t("checkout_order_received", locale)}</p>
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-card p-6">
          <PharmacyStatusStepper status="pending" />
        </div>

        <Link
          href="/"
          className="mt-6 flex items-center justify-center gap-1 rounded-sm text-sm font-medium text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {t("back_to_home", locale)}
        </Link>
      </main>
    );
  }

  if (cartLines.length === 0) {
    return (
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-14 text-center sm:px-6">
        <h1 className="text-xl font-semibold">{t("checkout_cart_empty_title", locale)}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("checkout_cart_empty_body", locale)}
        </p>
        <Link
          href="/pharmacy"
          className="mt-4 inline-flex items-center gap-1 rounded-sm text-sm font-medium text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {t("checkout_browse_pharmacy", locale)}
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href="/pharmacy"
        className="mb-6 inline-flex items-center gap-1 rounded-sm text-sm font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <ArrowLeft className="size-3.5" />
        {t("checkout_back_to_pharmacy", locale)}
      </Link>

      <h1 className="text-2xl font-semibold tracking-tight">{t("checkout_title", locale)}</h1>

      {!hasSession && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-pending/30 bg-pending-soft px-4 py-3.5 text-sm text-pending">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-semibold">{t("doctor_booking_no_session_title", locale)}</p>
            <p className="mt-0.5 opacity-90">{t("pharmacy_checkout_no_session_body", locale)}</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              <Link href="/" className="font-medium underline underline-offset-2">
                {t("start_assessment_cta", locale)}
              </Link>
              <Link href="/account" className="font-medium underline underline-offset-2">
                {t("header_log_in", locale)}
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 divide-y divide-border rounded-2xl border border-border bg-card px-4">
        {cartLines.map(({ line, item }) => (
          <div key={line.itemId} className="flex items-center gap-3 py-4">
            <PharmacyProductTile category={item!.category} photoUrl={item!.photoUrl} className="size-12 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item!.medicineName}</p>
              <p className="text-xs text-muted-foreground">
                {t("checkout_qty", locale)} {line.quantity}
              </p>
            </div>
            <span className="text-sm font-semibold">TZS {item!.unitPrice * line.quantity}</span>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <p className="text-sm font-semibold">{t("checkout_fulfillment", locale)}</p>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setFulfillment("pickup")}
            className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 ${
              fulfillment === "pickup"
                ? "border-primary bg-primary-soft text-accent-foreground"
                : "border-border text-muted-foreground hover:border-primary/40"
            }`}
          >
            <Package className="size-4" />
            {t("checkout_pickup", locale)}
          </button>
          <button
            type="button"
            onClick={() => setFulfillment("delivery")}
            className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 ${
              fulfillment === "delivery"
                ? "border-primary bg-primary-soft text-accent-foreground"
                : "border-border text-muted-foreground hover:border-primary/40"
            }`}
          >
            <Truck className="size-4" />
            {t("checkout_delivery", locale)}
          </button>
        </div>
      </div>

      <div className="mt-6 space-y-2 rounded-2xl border border-border bg-card p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t("pharmacy_subtotal", locale)}</span>
          <span>TZS {subtotal}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            {fulfillment === "delivery"
              ? t("checkout_delivery_fee", locale)
              : t("checkout_pickup_fee", locale)}
          </span>
          <span>TZS {fees}</span>
        </div>
        <div className="flex justify-between border-t border-border pt-2 font-semibold">
          <span>{t("checkout_total", locale)}</span>
          <span>TZS {total}</span>
        </div>
      </div>

      {error ? (
        <p role="alert" className="mt-4 rounded-xl bg-urgent-soft px-4 py-3 text-sm text-urgent">
          {error}
        </p>
      ) : null}

      <Button
        className="mt-6 h-11 w-full rounded-xl"
        disabled={!hasSession || pending}
        onClick={handlePlaceOrder}
      >
        {pending ? "Placing order..." : t("checkout_place_order", locale)}
      </Button>
    </main>
  );
}
