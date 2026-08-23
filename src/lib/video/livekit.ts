import "server-only";
import { AccessToken, RoomServiceClient } from "livekit-server-sdk";
import { withRetry, RetryableError } from "@/lib/retry";

function livekitEnv() {
  const url = process.env.LIVEKIT_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!url || !apiKey || !apiSecret) {
    throw new Error("LIVEKIT_URL, LIVEKIT_API_KEY, or LIVEKIT_API_SECRET is not set");
  }
  return { url, apiKey, apiSecret };
}

// Rooms are named after the appointment so rejoining reuses the same room
// instead of creating duplicates. emptyTimeout closes the room 4 hours after
// the last participant leaves -- plenty for a consultation, short enough not
// to leave orphaned rooms sitting in the LiveKit dashboard.
export async function getOrCreateRoomForAppointment(appointmentId: string) {
  const { url, apiKey, apiSecret } = livekitEnv();
  const roomName = `appt-${appointmentId}`;
  const httpUrl = url.replace(/^wss:\/\//, "https://").replace(/^ws:\/\//, "http://");
  const roomService = new RoomServiceClient(httpUrl, apiKey, apiSecret);

  // Retried on any failure -- both calls are safe to repeat: listRooms is a
  // pure read, and createRoom only ever runs after confirming the room
  // doesn't exist yet, by a deterministic name, so a retried create can't
  // produce a duplicate room for the same appointment. Wrapped as
  // RetryableError regardless of what the SDK actually threw, since
  // anything from either call here is safe to retry, not just network-
  // level failures.
  await withRetry(async () => {
    try {
      const existing = await roomService.listRooms([roomName]);
      if (existing.length > 0) {
        return;
      }
      await roomService.createRoom({
        name: roomName,
        emptyTimeout: 60 * 60 * 4,
        maxParticipants: 2,
      });
    } catch (error) {
      throw new RetryableError(error instanceof Error ? error.message : "LiveKit room setup failed");
    }
  });

  return { name: roomName, url };
}

export async function createMeetingToken(roomName: string, userName: string, isOwner: boolean) {
  const { apiKey, apiSecret } = livekitEnv();

  const token = new AccessToken(apiKey, apiSecret, {
    identity: `${isOwner ? "provider" : "patient"}-${crypto.randomUUID()}`,
    name: userName,
    ttl: 60 * 60 * 2,
  });
  token.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    roomAdmin: isOwner,
  });

  return token.toJwt();
}

export async function listRoomParticipantIdentities(roomName: string) {
  try {
    const { url, apiKey, apiSecret } = livekitEnv();
    const httpUrl = url.replace(/^wss:\/\//, "https://").replace(/^ws:\/\//, "http://");
    const roomService = new RoomServiceClient(httpUrl, apiKey, apiSecret);
    const participants = await roomService.listParticipants(roomName);
    return participants.map((participant) => participant.identity);
  } catch {
    return [];
  }
}
