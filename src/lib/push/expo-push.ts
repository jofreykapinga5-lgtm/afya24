import "server-only";

// Thin wrapper around Expo's push HTTP API -- no server-side SDK needed for
// a single-notification send, this is just a plain POST. Never throws: a
// failed push (an expired/invalid token, Expo's service down) shouldn't take
// down whatever real event triggered it (a doctor going online, a med
// reminder) -- the same in-app notification row already covers the patient
// seeing it next time they open the app regardless.
export async function sendExpoPushNotification(input: {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}): Promise<void> {
  try {
    await fetch("https://exp.host/--/api/v2/push/send", {
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
  } catch (error) {
    console.error("sendExpoPushNotification failed", error);
  }
}
