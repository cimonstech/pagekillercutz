CREATE TABLE IF NOT EXISTS platform_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

INSERT INTO platform_settings (key, value) VALUES
  ('accept_bookings', 'true'::jsonb),
  ('merch_store_active', 'true'::jsonb),
  ('playlist_portal_open', 'true'::jsonb),
  ('maintenance_mode', 'false'::jsonb),
  ('show_pricing', 'true'::jsonb),
  ('music_streaming', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings_service_all"
  ON platform_settings FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "settings_admin_read"
  ON platform_settings FOR SELECT
  USING (true);
