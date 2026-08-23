import "server-only";

const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_BASE_DELAY_MS = 300;

// A transient failure worth retrying -- a network blip or the far end
// being briefly overloaded -- not a request that's wrong in a way
// retrying won't fix (a bad request, bad credentials, "payment not
// found"). Throw this specifically for the failure modes that ARE worth
// retrying; anything else thrown propagates immediately.
export class RetryableError extends Error {}

// Short exponential backoff (300ms, 600ms by default) on RetryableError or
// a raw network failure (fetch() itself throws TypeError for those, same
// as browsers). Only safe to wrap around a pure read, or a write that's
// already idempotency-keyed (see lib/payments/snippe.ts's
// createSnippeCollectionPayment) -- retrying a non-idempotent write on a
// timeout risks the original request having actually succeeded.
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxAttempts?: number; baseDelayMs?: number } = {}
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const baseDelayMs = options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      const retryable = error instanceof RetryableError || error instanceof TypeError;
      if (attempt === maxAttempts || !retryable) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, baseDelayMs * 2 ** (attempt - 1)));
    }
  }
  // Unreachable -- the loop above always either returns or throws.
  throw new Error("withRetry: exhausted attempts without a result");
}
