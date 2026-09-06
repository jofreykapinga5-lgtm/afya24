import "server-only";

// Thin wrapper around Expo's push HTTP API -- no server-side SDK needed for
// a single-notification send, this is just a plain POST. Never throws: a
// failed push (an expired/invalid token, Expo's service down) shouldn't take
// down whatever real event triggered it (a doctor going online, a med
// reminder) -- the same in-app notification row already covers the patient
// seeing it next time they open the app regardless.
//
// A prior version only awaited fetch() and never read the response, so an
// HTTP 200 carrying a per-message error ticket (Expo's push API always
// answers 200 even when a message itself failed) looked identical to a real
// success -- a dead token (app uninstalled, token rotated -- Expo reports
// this as "DeviceNotRegistered") would be "sent to" forever with no signal
// to prune it. Both functions below now parse the response and report back
// whether each token looked dead, so a caller with DB access can delete it.
type PushResult = { ok: boolean; deadToken?: boolean };

function isDeviceNotRegistered(ticket: unknown): boolean {
  const t = ticket as { status?: string; details?: { error?: string } } | undefined;
  return t?.status === "error" && t?.details?.error === "DeviceNotRegistered";
}

export async function sendExpoPushNotification(input: {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}): Promise<PushResult> {
  try {
    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        to: input.to,
        title: input.title,
        body: input.body,
        data: input.data ?? {},
        sound: "default",
      }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      console.error("sendExpoPushNotification: HTTP error", res.status, json);
      return { ok: false };
    }
    const ticket = json?.data;
    if (ticket?.status === "error") {
      console.error("sendExpoPushNotification: ticket error", ticket);
      return { ok: false, deadToken: isDeviceNotRegistered(ticket) };
    }
    return { ok: true };
  } catch (error) {
    console.error("sendExpoPushNotification failed", error);
    return { ok: false };
  }
}

// Batched form -- Expo's endpoint accepts an array of up to 100 messages per
// request, so notifying every subscriber to one doctor coming online costs
// one HTTP round trip instead of one per patient. (No chunking beyond 100
// yet -- not a real scale this app is anywhere near; add it if that changes.)
// Returns one result per input message, same order, for the caller to match
// back up against which token/patient it was for.
export async function sendExpoPushNotifications(
  messages: { to: string; title: string; body: string; data?: Record<string, unknown> }[]
): Promise<PushResult[]> {
  if (messages.length === 0) return [];
  try {
    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(
        messages.map((m) => ({ to: m.to, title: m.title, body: m.body, data: m.data ?? {}, sound: "default" }))
      ),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !Array.isArray(json?.data)) {
      console.error("sendExpoPushNotifications: HTTP/parse error", res.status, json);
      return messages.map(() => ({ ok: false }));
    }
    return messages.map((_, i) => {
      const ticket = json.data[i];
      if (ticket?.status === "error") {
        console.error("sendExpoPushNotifications: ticket error", ticket);
        return { ok: false, deadToken: isDeviceNotRegistered(ticket) };
      }
      return { ok: true };
    });
  } catch (error) {
    console.error("sendExpoPushNotifications failed", error);
    return messages.map(() => ({ ok: false }));
  }
}
