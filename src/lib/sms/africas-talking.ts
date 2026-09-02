import "server-only";

// Thin wrapper around Africa's Talking's SMS API -- mirrors lib/video/livekit.ts
// and lib/payments/snippe.ts's shape: no DB access here, just the HTTP
// contract. Chosen over Twilio for direct local telco routing in Tanzania.
//
// NOT LIVE YET: needs AFRICAS_TALKING_API_KEY and AFRICAS_TALKING_USERNAME
// (from the Africa's Talking dashboard, an account that doesn't exist yet
// as of this file being written) before any SMS can actually send. Fails
// loudly rather than silently no-opping, so a misconfigured deploy is
// obvious in logs rather than looking like a working reset flow.
export async function sendSms(to: string, message: string): Promise<void> {
  const apiKey = process.env.AFRICAS_TALKING_API_KEY;
  const username = process.env.AFRICAS_TALKING_USERNAME;

  if (!apiKey || !username) {
    throw new Error(
      "SMS is not configured yet -- set AFRICAS_TALKING_API_KEY and AFRICAS_TALKING_USERNAME."
    );
  }

  const response = await fetch("https://api.africastalking.com/version1/messaging", {
    method: "POST",
    headers: {
      apiKey,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({ username, to, message }).toString(),
  });

  if (!response.ok) {
    throw new Error(`SMS send failed: HTTP ${response.status}`);
  }

  const data = (await response.json()) as {
    SMSMessageData?: { Recipients?: { status: string; statusCode: number }[] };
  };
  const recipient = data.SMSMessageData?.Recipients?.[0];
  if (recipient && recipient.status !== "Success") {
    throw new Error(`SMS send failed: ${recipient.status}`);
  }
}
