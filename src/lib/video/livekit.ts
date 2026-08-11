import "server-only";
import { AccessToken, RoomServiceClient } from "livekit-server-sdk";

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

  const existing = await roomService.listRooms([roomName]);
  if (existing.length > 0) {
    return { name: roomName, url };
  }

  await roomService.createRoom({
    name: roomName,
    emptyTimeout: 60 * 60 * 4,
    maxParticipants: 2,
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
