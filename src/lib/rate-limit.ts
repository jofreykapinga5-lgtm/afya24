import "server-only";
import { headers } from "next/headers";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

type LimiterName =
  | "auth"
  | "signup"
  | "aiChat"
  | "providerApplication"
  | "payment"
  | "upload"
  | "claimToken"
  | "lookup"
  | "staffPasswordReset"
  | "patientOtp";

// Limits chosen per endpoint's actual abuse cost: password/AI attempts are
// cheap to retry so get a short tight window, account/application creation
// is spammier to clean up afterward so gets a longer window with fewer tries.
// "payment" is deliberately the tightest -- each attempt can push a real
// M-Pesa/Airtel prompt to the patient's phone, so repeat calls are a
// harassment/cost vector, not just a DB-spam one. "patientOtp" is just as
// tight for the same reason -- each request sends (or will, once a real SMS
// provider is wired) a real SMS, a cost per call, not just a DB write --
// this is now the primary sign-in/sign-up path, not just password reset, so
// it's named generically; "staffPasswordReset" is email-based (free, doctor
// portal only) so gets a looser window, matching "auth".
const LIMITER_CONFIG: Record<LimiterName, { max: number; window: `${number} ${"s" | "m" | "h"}` }> = {
  auth: { max: 10, window: "5 m" },
  signup: { max: 5, window: "1 h" },
  aiChat: { max: 20, window: "10 m" },
  providerApplication: { max: 5, window: "1 h" },
  payment: { max: 5, window: "10 m" },
  upload: { max: 30, window: "10 m" },
  claimToken: { max: 20, window: "10 m" },
  lookup: { max: 10, window: "10 m" },
  staffPasswordReset: { max: 5, window: "10 m" },
  patientOtp: { max: 5, window: "10 m" },
};

const limiters = new Map<LimiterName, Ratelimit>();

function getLimiter(name: LimiterName): Ratelimit | null {
  if (!redis) return null;
  const cached = limiters.get(name);
  if (cached) return cached;

  const { max, window } = LIMITER_CONFIG[name];
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(max, window),
    prefix: `ratelimit:${name}`,
  });
  limiters.set(name, limiter);
  return limiter;
}

// Fails open when Upstash isn't configured, so local dev without Redis
// credentials still works -- this only becomes an enforced limit once
// UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are set.
export async function checkRateLimit(name: LimiterName, identifier: string) {
  const limiter = getLimiter(name);
  if (!limiter) return { allowed: true as const };

  const result = await limiter.limit(identifier);
  return { allowed: result.success };
}

// Server Actions don't receive a Request object, so the client IP has to be
// read off the incoming headers Next.js exposes -- Vercel sets x-forwarded-for
// on every request reaching a function.
export async function getClientIp() {
  const list = await headers();
  const forwardedFor = list.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]!.trim();
  return list.get("x-real-ip") ?? "unknown";
}

export function getClientIpFromRequest(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
