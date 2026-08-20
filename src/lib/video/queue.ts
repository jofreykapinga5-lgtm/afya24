export const QUEUE_HEARTBEAT_TTL_MS = 60_000;
export const PATIENT_ACCESS_WINDOW_HOURS = 24;

export function patientAccessCutoff() {
  return new Date(Date.now() - PATIENT_ACCESS_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
}

export function queueHeartbeatCutoff() {
  return new Date(Date.now() - QUEUE_HEARTBEAT_TTL_MS).toISOString();
}

export function hasRecentQueueHeartbeat(value: string | null | undefined) {
  if (!value) return false;
  return Date.now() - new Date(value).getTime() <= QUEUE_HEARTBEAT_TTL_MS;
}
