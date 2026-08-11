-- Video sessions moved from Daily.co to LiveKit; update the default so new
-- rows reflect the current provider (existing rows are backfilled too, since
-- no session has ever been created with a real Daily.co key).
alter table public.video_sessions
  alter column room_provider set default 'livekit';

update public.video_sessions
  set room_provider = 'livekit'
  where room_provider = 'daily';
