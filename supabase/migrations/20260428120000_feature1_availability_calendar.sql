-- Feature 1: Time-aware availability, calendar blocks, booking request status, company fields.
-- Run in Supabase SQL Editor if you do not use CLI migrations.

-- Bookings: time windows + company + request metadata
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS event_start_time time;

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS event_duration_hours int DEFAULT 3;

-- End time = start + duration + 3h buffer (computed when start is set)
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS event_end_time time
  GENERATED ALWAYS AS (
    (
      COALESCE(event_start_time, TIME '18:00:00')
      + make_interval(hours => COALESCE(event_duration_hours, 3) + 3)
    )::time
  ) STORED;

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS event_start_time_input text;

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS booking_type text NOT NULL DEFAULT 'normal';

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS is_company boolean NOT NULL DEFAULT false;

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS company_name text;

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS rep_title text;

COMMENT ON COLUMN bookings.booking_type IS 'normal | request (blocked-date inquiry)';
COMMENT ON COLUMN bookings.event_start_time_input IS 'Raw HH:MM (or similar) from booking form';

-- Manual calendar blocks (admin)
CREATE TABLE IF NOT EXISTS calendar_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  block_date date NOT NULL,
  block_type text NOT NULL DEFAULT 'full_day',
  start_time time,
  end_time time,
  reason text,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT calendar_blocks_block_type_check CHECK (block_type IN ('full_day', 'time_range'))
);

CREATE INDEX IF NOT EXISTS idx_calendar_blocks_block_date ON calendar_blocks (block_date);

ALTER TABLE calendar_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "calendar_blocks_service_role_all" ON calendar_blocks;
CREATE POLICY "calendar_blocks_service_role_all"
  ON calendar_blocks
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "calendar_blocks_public_read" ON calendar_blocks;
CREATE POLICY "calendar_blocks_public_read"
  ON calendar_blocks
  FOR SELECT
  USING (true);
