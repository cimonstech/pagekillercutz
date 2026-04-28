ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS deposit_due_date date,
ADD COLUMN IF NOT EXISTS balance_due_date date,
ADD COLUMN IF NOT EXISTS deposit_amount decimal,
ADD COLUMN IF NOT EXISTS balance_amount decimal,
ADD COLUMN IF NOT EXISTS deposit_paid boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS deposit_paid_at timestamptz;

