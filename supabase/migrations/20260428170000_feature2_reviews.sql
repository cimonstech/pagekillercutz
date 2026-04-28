CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  event_id text NOT NULL,
  client_name text NOT NULL,
  client_email text NOT NULL,
  event_type text,
  event_month text,
  rating int CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  status text NOT NULL DEFAULT 'pending',
  hidden_reason text,
  reviewed_by text,
  reviewed_at timestamptz,
  submitted_at timestamptz DEFAULT now(),
  token text UNIQUE,
  token_expires_at timestamptz
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'reviews'
      AND policyname = 'public_read_approved'
  ) THEN
    CREATE POLICY "public_read_approved"
      ON reviews FOR SELECT
      USING (status = 'approved');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'reviews'
      AND policyname = 'service_role_all'
  ) THEN
    CREATE POLICY "service_role_all"
      ON reviews FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;
