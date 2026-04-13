-- Run in Supabase SQL Editor if migrations are not applied automatically.

CREATE TABLE IF NOT EXISTS play_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id)
    ON DELETE SET NULL,
  music_id uuid REFERENCES music(id)
    ON DELETE CASCADE,
  track_title text NOT NULL,
  artist text NOT NULL DEFAULT 'Page KillerCutz',
  release_type text,
  duration_played int DEFAULT 0,
  source text DEFAULT 'music_page',
  session_id text,
  played_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS play_events_user_id_idx
  ON play_events(user_id);
CREATE INDEX IF NOT EXISTS play_events_music_id_idx
  ON play_events(music_id);
CREATE INDEX IF NOT EXISTS play_events_played_at_idx
  ON play_events(played_at);

ALTER TABLE play_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_plays"
  ON play_events FOR ALL
  USING (
    auth.uid() = user_id
    OR auth.role() = 'service_role'
  )
  WITH CHECK (
    auth.uid() = user_id
    OR auth.role() = 'service_role'
  );
