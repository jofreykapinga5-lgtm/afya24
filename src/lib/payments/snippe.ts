import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { withRetry, RetryableError } from "@/lib/retry";

// Thin wrapper around Snippe (api.snippe.sh), a Tanzania mobile-money
// payment gateway (M-Pesa, Airtel Money, Halotel, Mixx by Yas). Mirrors
// lib/video/livekit.ts's shape: no DB access here, just the HTTP contract --
// see supabase/migrations/0014_snippe_payments.sql and
// lib/payments/reconcile.ts for what happens with the result.

const BASE_URL = "https://api.snippe.sh";

export type SnippeChannelProvider = "mpesa" | "airtel" | "halotel" | "mixx";
export type SnippePaymentStatus = "pending" | "completed" | "failed" | "voided" | "expired";

function snippeApiKey() {
  const key = process.env.SNIPPE_API_KEY;
  if (!key) {
    throw new Error("SNIPPE_API_KEY is not set");
  }
  return key;
}

type SnippeEnvelope<T> =
  | { status: "success"; code: number; data: T }
  | { status: "error"; code: number; error_code: string; message: string };

// Retried on a network blip or a 5xx (Snippe briefly overloaded) -- never
// on a 4xx, which is a real business response (invalid signature, payment
// not found) the caller already handles. Safe to retry a POST here too:
// every write goes through createSnippeCollectionPayment, which always
// carries an Idempotency-Key, so a retried create returns the original
// payment instead of charging the patient twice.
async function snippeRequest<T>(
  path: string,
  init: RequestInit & { idempotencyKey?: string } = {}
): Promise<SnippeEnvelope<T>> {
  return withRetry(async () => {
    const { idempotencyKey, ...requestInit } = init;
    const response = await fetch(`${BASE_URL}${path}`, {
      ...requestInit,
      headers: {
        Authorization: `Bearer ${snippeApiKey()}`,
        "Content-Type": "application/json",
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
        ...requestInit.headers,
      },
    });

    if (response.status >= 500) {
      throw new RetryableError(`Snippe server error (${response.status})`);
    }

    const text = await response.text();
    let body: unknown;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      throw new RetryableError(`Snippe returned a non-JSON response (${response.status})`);
    }

    return body as SnippeEnvelope<T>;
  });
}

export async function createSnippeCollectionPayment(input: {
  idempotencyKey: string;
  amountValue: number;
  channelProvider: SnippeChannelProvider;
  phone: string;
  firstName: string;
  lastName: string;
  email: string;
  webhookUrl: string;
  metadata: Record<string, string>;
}): Promise<{ reference: string; status: string; createdAt: string }> {
  const result = await snippeRequest<{ reference: string; status: string; created_at: string }>(
    "/v1/payments",
    {
      method: "POST",
      idempotencyKey: input.idempotencyKey,
      body: JSON.stringify({
        payment_type: "mobile",
        phone_number: input.phone,
        details: { amount: input.amountValue, currency: "TZS" },
        channel: { provider: input.channelProvider },
        customer: {
          firstname: input.firstName,
          lastname: input.lastName,
          email: input.email,
        },
        webhook_url: input.webhookUrl,
        metadata: input.metadata,
      }),
    }
  );

  if (result.status !== "success") {
    throw new Error(result.message || "Could not start the payment.");
  }

  return {
    reference: result.data.reference,
    status: result.data.status,
    createdAt: result.data.created_at,
  };
}

export async function getSnippePaymentStatus(
  reference: string
): Promise<
  | { found: true; status: SnippePaymentStatus; createdAt: string; completedAt: string | null }
  | { found: false }
> {
  const result = await snippeRequest<{
    reference: string;
    status: SnippePaymentStatus;
    created_at: string;
    completed_at?: string;
  }>(`/v1/payments/${reference}`, { method: "GET" });

  if (result.status !== "success") {
    // Confirmed live: a fake/unknown reference returns
    // {status:"error", code:404, error_code:"RES_001", message:"payment not found"}.
    // Any other error status is treated the same way here -- the caller
    // (checkSnippePaymentStatus) just keeps polling rather than surfacing a
    // transient gateway error as a hard payment failure.
    return { found: false };
  }

  return {
    found: true,
    status: result.data.status,
    createdAt: result.data.created_at,
    completedAt: result.data.completed_at ?? null,
  };
}

const WEBHOOK_TOLERANCE_SECONDS = 5 * 60;

// HMAC-SHA256 of "{timestamp}.{raw body}", hex-encoded, per Snippe's
// webhook docs. Verify against the RAW request body (exact bytes) -- never
// re-serialize JSON.parse(body) before checking the signature, since that
// can silently change the byte sequence the signature was computed over.
export function verifySnippeWebhookSignature(
  rawBody: string,
  timestampHeader: string | null,
  signatureHeader: string | null
): boolean {
  const secret = process.env.SNIPPE_WEBHOOK_SECRET;
  if (!secret || !timestampHeader || !signatureHeader) {
    return false;
  }

  const timestamp = Number(timestampHeader);
  if (!Number.isFinite(timestamp)) {
    return false;
  }
  if (Math.abs(Date.now() / 1000 - timestamp) > WEBHOOK_TOLERANCE_SECONDS) {
    return false;
  }

  const expected = createHmac("sha256", secret).update(`${timestampHeader}.${rawBody}`).digest("hex");

  const expectedBuffer = Buffer.from(expected, "hex");
  const actualBuffer = Buffer.from(signatureHeader, "hex");
  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualBuffer);
}
