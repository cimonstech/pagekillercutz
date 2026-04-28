CREATE TABLE IF NOT EXISTS payment_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  momo_enabled boolean DEFAULT true,
  momo_network text DEFAULT 'MTN',
  momo_number text,
  momo_account_name text,
  bank_enabled boolean DEFAULT false,
  bank_name text,
  bank_account_number text,
  bank_account_name text,
  bank_branch text,
  preferred_method text DEFAULT 'momo',
  payment_instructions text,
  updated_by text,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

INSERT INTO payment_settings (
  momo_enabled,
  momo_network,
  momo_number,
  momo_account_name,
  bank_enabled,
  preferred_method,
  payment_instructions
) VALUES (
  true,
  'MTN',
  '0240639403',
  'Page KillerCutz',
  false,
  'momo',
  'Send payment via Mobile Money or bank transfer. Use your Event ID or Order ID as the payment reference/narration.'
)
ON CONFLICT DO NOTHING;

ALTER TABLE payment_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all" ON payment_settings;
CREATE POLICY "service_role_all"
  ON payment_settings FOR ALL
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "public_read" ON payment_settings;
CREATE POLICY "public_read"
  ON payment_settings FOR SELECT
  USING (true);

