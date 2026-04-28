ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS package_price decimal;
