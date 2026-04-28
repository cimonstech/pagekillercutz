CREATE TABLE IF NOT EXISTS contract_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version int NOT NULL DEFAULT 1,
  is_current boolean DEFAULT true,
  deposit_percentage decimal DEFAULT 30,
  payment_deadline_days int DEFAULT 7,
  cancellation_tiers jsonb DEFAULT '[
    {"days_min": 30, "days_max": null, "percentage_retained": 0, "label": "30+ days before"},
    {"days_min": 15, "days_max": 29, "percentage_retained": 50, "label": "15-29 days before"},
    {"days_min": 7, "days_max": 14, "percentage_retained": 75, "label": "7-14 days before"},
    {"days_min": 0, "days_max": 6, "percentage_retained": 100, "label": "Less than 7 days"}
  ]',
  dj_cancellation_compensation_pct decimal DEFAULT 20,
  dj_cancellation_notice_days int DEFAULT 14,
  overtime_rate_ghs decimal DEFAULT 500,
  free_postponements_allowed int DEFAULT 1,
  postponement_min_notice_days int DEFAULT 14,
  buffer_hours int DEFAULT 3,
  custom_clauses jsonb DEFAULT '[]',
  force_majeure_text text DEFAULT 'Neither party shall be liable for failure to perform obligations due to circumstances beyond reasonable control, including but not limited to acts of God, government actions, or national emergencies.',
  governing_law text DEFAULT 'Republic of Ghana',
  updated_by text,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

INSERT INTO contract_settings (is_current)
SELECT true
WHERE NOT EXISTS (SELECT 1 FROM contract_settings);

ALTER TABLE contract_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'contract_settings'
      AND policyname = 'service_role_all'
  ) THEN
    CREATE POLICY "service_role_all"
      ON contract_settings FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'contract_settings'
      AND policyname = 'admin_read'
  ) THEN
    CREATE POLICY "admin_read"
      ON contract_settings FOR SELECT
      USING (true);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  event_id text NOT NULL,
  contract_settings_version int,
  contract_html text NOT NULL,
  contract_text text NOT NULL,
  contract_hash text NOT NULL,
  status text DEFAULT 'pending',
  signing_token text UNIQUE,
  token_expires_at timestamptz,
  client_signed_at timestamptz,
  client_ip text,
  client_user_agent text,
  client_signature_type text,
  client_signature_data text,
  dj_signature_data text,
  pdf_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'contracts'
      AND policyname = 'service_role_all'
  ) THEN
    CREATE POLICY "service_role_all"
      ON contracts FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;
